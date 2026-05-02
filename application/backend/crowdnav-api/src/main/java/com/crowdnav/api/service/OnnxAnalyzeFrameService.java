package com.crowdnav.api.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.dto.BBox;
import com.crowdnav.api.dto.PersonDetection;
import com.crowdnav.api.inference.CrowdNavHeuristics;
import com.crowdnav.api.inference.YoloOnnxEngine;

import ai.onnxruntime.OrtException;
import jakarta.annotation.PreDestroy;

@Service
@ConditionalOnProperty(name = "app.inference.mode", havingValue = "onnx")
public class OnnxAnalyzeFrameService implements AnalyzeFrameService {

	private final YoloOnnxEngine engine;

	public OnnxAnalyzeFrameService(
			@Value("${app.inference.onnx-model-path:}") String modelPath,
			@Value("${app.inference.imgsz:640}") int imgsz,
			@Value("${app.inference.conf-threshold:0.25}") float confThreshold) throws OrtException {
		if (!StringUtils.hasText(modelPath)) {
			throw new IllegalStateException(
					"app.inference.onnx-model-path is required when app.inference.mode=onnx "
							+ "(set CROWDNAV_ONNX_PATH or export path from train/scripts/eval_yolo.py --export-onnx).");
		}
		Path p = Path.of(modelPath);
		if (!Files.isRegularFile(p)) {
			throw new IllegalStateException("ONNX model file not found: " + p.toAbsolutePath());
		}
		this.engine = new YoloOnnxEngine(p.toString(), imgsz, confThreshold);
	}

	@PreDestroy
	void shutdown() throws OrtException {
		engine.close();
	}

	@Override
	public AnalyzeFrameResponse analyzeFrame(@Nullable byte[] imageBytes, @Nullable String contentType) {
		if (imageBytes == null || imageBytes.length == 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image body is required for ONNX inference");
		}
		try {
			List<PersonDetection> persons = engine.detect(imageBytes);
			List<BBox> boxes = persons.stream().map(PersonDetection::bbox).toList();
			String risk = CrowdNavHeuristics.maxProximityRisk(boxes);
			String density = CrowdNavHeuristics.crowdDensity(persons.size());
			String rec = CrowdNavHeuristics.recommendation(risk);
			return new AnalyzeFrameResponse(persons, density, risk, rec);
		}
		catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image: " + e.getMessage());
		}
		catch (OrtException e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Inference failed: " + e.getMessage());
		}
	}
}
