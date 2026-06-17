import numpy as np
from numpy.typing import NDArray
from typing import Tuple, Optional


class Projector:
    """
    Handles transformation between 2D image coordinates and Bird's Eye View (BEV).
    Used for density mapping and accurate velocity calculation.
    """

    def __init__(self, homography_matrix: Optional[NDArray[np.float64]] = None):
        """
        Initialize with a 3x3 Homography matrix.
        If None, defaults to Identity matrix (no transformation).
        """
        if homography_matrix is not None:
            if homography_matrix.shape != (3, 3):
                raise ValueError("Homography matrix must be 3x3.")
            self.H = homography_matrix
        else:
            self.H = np.eye(3)

    def image_to_bev(self, x: float, y: float) -> Tuple[float, float]:
        """
        Transforms image coordinates (x, y) to BEV coordinates (x_real, y_real).
        Formula: [x', y', w']^T = H * [x, y, 1]^T
                 x_real = x' / w', y_real = y' / w'
        """
        point = np.array([x, y, 1.0], dtype=np.float64).reshape(3, 1)
        bev_point = np.dot(self.H, point)

        # Avoid division by zero
        w = bev_point[2, 0]
        if abs(w) < 1e-9:
            return 0.0, 0.0

        return float(bev_point[0, 0] / w), float(bev_point[1, 0] / w)

    def bev_to_image(self, x_real: float, y_real: float) -> Tuple[float, float]:
        """
        Transforms BEV coordinates (x_real, y_real) back to image coordinates (x, y).
        Uses the inverse of the Homography matrix.
        """
        try:
            H_inv = np.linalg.inv(self.H)
        except np.linalg.LinAlgError:
            return 0.0, 0.0

        point = np.array([x_real, y_real, 1.0], dtype=np.float64).reshape(3, 1)
        img_point = np.dot(H_inv, point)

        w = img_point[2, 0]
        if abs(w) < 1e-9:
            return 0.0, 0.0

        return float(img_point[0, 0] / w), float(img_point[1, 0] / w)


if __name__ == "__main__":
    # Example: Simple translation matrix
    H = np.array([[1, 0, 10], [0, 1, 20], [0, 0, 1]])
    projector = Projector(H)
    bev = projector.image_to_bev(50, 50)
    print(f"Image (50, 50) -> BEV {bev}")  # Expected (60, 70)
