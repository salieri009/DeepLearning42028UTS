package com.crowdnav.api.inference;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;

import com.crowdnav.api.dto.BBox;
import com.crowdnav.api.dto.PersonDetection;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OnnxValue;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import ai.onnxruntime.OrtSession.Result;

/**
 * YOLOv8 ONNX with embedded NMS (Ultralytics export: {@code yolo export ... nms=True}).
 * Expects output shaped [1, N, 6] or [N, 6] with x1,y1,x2,y2,conf,cls in letterboxed pixel coords.
 */
public final class YoloOnnxEngine implements AutoCloseable {

	private final OrtEnvironment env;
	private final OrtSession session;
	private final String inputName;
	private final int imgsz;
	private final float confThreshold;

	public YoloOnnxEngine(String modelPath, int imgsz, float confThreshold) throws OrtException {
		this.env = OrtEnvironment.getEnvironment();
		OrtSession.SessionOptions opts = new OrtSession.SessionOptions();
		this.session = this.env.createSession(modelPath, opts);
		this.inputName = this.session.getInputNames().iterator().next();
		this.imgsz = imgsz;
		this.confThreshold = confThreshold;
	}

	@Override
	public void close() throws OrtException {
		this.session.close();
	}

	public List<PersonDetection> detect(byte[] imageBytes) throws IOException, OrtException {
		BufferedImage img = ImageIO.read(new ByteArrayInputStream(imageBytes));
		if (img == null) {
			throw new IOException("Could not decode image bytes");
		}
		Letterbox lb = Letterbox.from(img, imgsz);
		float[][][][] input = lb.tensor;
		try (OnnxTensor tensor = OnnxTensor.createTensor(env, input);
				Result outputs = session.run(Map.of(inputName, tensor))) {
			OnnxValue first = outputs.get(0);
			if (!(first instanceof OnnxTensor onnxOut)) {
				throw new OrtException("Unexpected ONNX output type: " + first.getClass());
			}
			return decode(onnxOut, lb, img.getWidth(), img.getHeight());
		}
	}

	private List<PersonDetection> decode(OnnxTensor onnxOut, Letterbox lb, int origW, int origH) throws OrtException {
		Object raw = onnxOut.getValue();
		long[] shape = onnxOut.getInfo().getShape();
		if (raw instanceof float[][][] arr3 && arr3.length > 0) {
			float[][] row0 = arr3[0];
			if (row0 != null && row0.length > 0 && row0[0].length >= 6) {
				return parseRows(row0, lb, origW, origH);
			}
		}
		if (raw instanceof float[][] arr2 && arr2.length > 0 && arr2[0].length >= 6) {
			return parseRows(arr2, lb, origW, origH);
		}
		throw new OrtException(
				"Unexpected YOLO ONNX output (shape hint "
						+ Arrays.toString(shape)
						+ "). Re-export with: python train/scripts/eval_yolo.py --weights ... --export-onnx");
	}

	private List<PersonDetection> parseRows(float[][] rows, Letterbox lb, int origW, int origH) {
		List<PersonDetection> out = new ArrayList<>();
		if (rows == null) {
			return out;
		}
		for (float[] row : rows) {
			if (row == null || row.length < 6) {
				continue;
			}
			float conf = row[4];
			if (conf < confThreshold) {
				continue;
			}
			float x1 = row[0];
			float y1 = row[1];
			float x2 = row[2];
			float y2 = row[3];
			if (x2 <= x1 || y2 <= y1) {
				continue;
			}
			double x1o = (x1 - lb.padX) / lb.ratio;
			double y1o = (y1 - lb.padY) / lb.ratio;
			double x2o = (x2 - lb.padX) / lb.ratio;
			double y2o = (y2 - lb.padY) / lb.ratio;
			x1o = clamp(x1o, 0, origW);
			y1o = clamp(y1o, 0, origH);
			x2o = clamp(x2o, 0, origW);
			y2o = clamp(y2o, 0, origH);
			double w = x2o - x1o;
			double h = y2o - y1o;
			if (w < 1e-6 || h < 1e-6) {
				continue;
			}
			double xc = (x1o + x2o) / 2.0 / origW;
			double yc = (y1o + y2o) / 2.0 / origH;
			double nw = w / origW;
			double nh = h / origH;
			out.add(new PersonDetection("person", conf, new BBox(xc, yc, nw, nh)));
		}
		return out;
	}

	private static double clamp(double v, double lo, double hi) {
		return Math.max(lo, Math.min(hi, v));
	}

	static final class Letterbox {

		final double ratio;
		final double padX;
		final double padY;
		final float[][][][] tensor;

		private Letterbox(double ratio, double padX, double padY, float[][][][] tensor) {
			this.ratio = ratio;
			this.padX = padX;
			this.padY = padY;
			this.tensor = tensor;
		}

		static Letterbox from(BufferedImage src, int imgsz) {
			int w = src.getWidth();
			int h = src.getHeight();
			double r = Math.min((double) imgsz / w, (double) imgsz / h);
			int nw = (int) Math.round(w * r);
			int nh = (int) Math.round(h * r);
			int padX = (imgsz - nw) / 2;
			int padY = (imgsz - nh) / 2;
			BufferedImage resized = resize(src, nw, nh);
			BufferedImage canvas = new BufferedImage(imgsz, imgsz, BufferedImage.TYPE_INT_RGB);
			Graphics2D g = canvas.createGraphics();
			g.setColor(new Color(114, 114, 114));
			g.fillRect(0, 0, imgsz, imgsz);
			g.drawImage(resized, padX, padY, null);
			g.dispose();
			float[][][][] chw = new float[1][3][imgsz][imgsz];
			for (int y = 0; y < imgsz; y++) {
				for (int x = 0; x < imgsz; x++) {
					int rgb = canvas.getRGB(x, y);
					int rr = (rgb >> 16) & 0xff;
					int gg = (rgb >> 8) & 0xff;
					int bb = rgb & 0xff;
					chw[0][0][y][x] = rr / 255.0f;
					chw[0][1][y][x] = gg / 255.0f;
					chw[0][2][y][x] = bb / 255.0f;
				}
			}
			return new Letterbox(r, padX, padY, chw);
		}

		private static BufferedImage resize(BufferedImage src, int targetW, int targetH) {
			BufferedImage scaled = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_RGB);
			Graphics2D g2 = scaled.createGraphics();
			g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
			g2.drawImage(src, 0, 0, targetW, targetH, null);
			g2.dispose();
			return scaled;
		}
	}
}
