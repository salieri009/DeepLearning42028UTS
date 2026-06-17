package com.crowdnav.api.persistence.embeddable;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class BBoxEmbeddable {

	@Column(name = "x_center", nullable = false, precision = 6, scale = 4)
	private BigDecimal xCenter;

	@Column(name = "y_center", nullable = false, precision = 6, scale = 4)
	private BigDecimal yCenter;

	@Column(nullable = false, precision = 6, scale = 4)
	private BigDecimal width;

	@Column(nullable = false, precision = 6, scale = 4)
	private BigDecimal height;

	protected BBoxEmbeddable() {
	}

	public BBoxEmbeddable(BigDecimal xCenter, BigDecimal yCenter, BigDecimal width, BigDecimal height) {
		this.xCenter = xCenter;
		this.yCenter = yCenter;
		this.width = width;
		this.height = height;
	}

	public double getXCenter() {
		return xCenter.doubleValue();
	}

	public double getYCenter() {
		return yCenter.doubleValue();
	}

	public double getWidth() {
		return width.doubleValue();
	}

	public double getHeight() {
		return height.doubleValue();
	}
}
