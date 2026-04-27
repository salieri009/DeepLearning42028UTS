"""Launch a SageMaker PyTorch training job for CrowdNav YOLOv8 fine-tuning.

Run this script LOCALLY (not inside SageMaker). It uploads `deploy/` as the
source bundle, kicks off a training job using the entry-point
`sagemaker_train.py`, and prints the resulting model artifact location.

Prerequisites:
- AWS credentials configured (`aws configure` or environment variables)
- IAM role with SageMaker execution permissions (e.g. AmazonSageMakerFullAccess)
- Data already uploaded to S3 (see SageMaker_Migration_Plan.md)
- `pip install sagemaker boto3`

Usage:
  python deploy/sagemaker_launch.py \\
    --role arn:aws:iam::ACCOUNT_ID:role/SageMakerExecutionRole \\
    --bucket crowdnav-jrdb-data \\
    --instance-type ml.g5.xlarge \\
    --epochs 50 --batch 32 --model yolov8l.pt
"""

from __future__ import annotations

import argparse
import time
from pathlib import Path


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--role",
        required=True,
        help="SageMaker execution role ARN (e.g. arn:aws:iam::ACCOUNT:role/SageMakerExecutionRole)",
    )
    p.add_argument(
        "--bucket",
        required=True,
        help="S3 bucket containing training data (organized as splits/train|val|test)",
    )
    p.add_argument(
        "--data-prefix",
        default="data",
        help="S3 prefix where train/val/test directories live (default: data)",
    )
    p.add_argument(
        "--instance-type",
        default="ml.g5.xlarge",
        choices=[
            "ml.g4dn.xlarge",
            "ml.g4dn.2xlarge",
            "ml.g5.xlarge",
            "ml.g5.2xlarge",
            "ml.p3.2xlarge",
        ],
        help="SageMaker training instance (default: ml.g5.xlarge / A10G 24GB)",
    )
    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--batch", type=int, default=32)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--model", default="yolov8l.pt", help="Base model (yolov8m/l/x.pt)")
    p.add_argument("--workers", type=int, default=8)
    p.add_argument(
        "--max-runtime-hr",
        type=int,
        default=12,
        help="Max training runtime in hours (default 12)",
    )
    p.add_argument(
        "--use-spot",
        action="store_true",
        help="Use SageMaker Managed Spot Training (up to 70%% cheaper, may be interrupted)",
    )
    p.add_argument(
        "--job-name",
        default=None,
        help="Custom training job name (default: auto-generated with timestamp)",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()

    import sagemaker
    from sagemaker.pytorch import PyTorch

    print("=" * 60)
    print("[CrowdNav] Launching SageMaker training job")
    print("=" * 60)
    print(f"Role:          {args.role}")
    print(f"Bucket:        s3://{args.bucket}")
    print(f"Data prefix:   {args.data_prefix}/")
    print(f"Instance:      {args.instance_type}")
    print(f"Model:         {args.model}")
    print(f"Epochs/Batch:  {args.epochs} / {args.batch}")
    print(f"Spot pricing:  {args.use_spot}")
    print("=" * 60)

    job_name = args.job_name or f"crowdnav-yolo-{int(time.time())}"
    output_path = f"s3://{args.bucket}/output"

    estimator_kwargs = {
        "entry_point": "sagemaker_train.py",
        "source_dir": str(Path(__file__).parent),
        "role": args.role,
        "instance_type": args.instance_type,
        "instance_count": 1,
        "framework_version": "2.0.1",
        "py_version": "py310",
        "output_path": output_path,
        "base_job_name": "crowdnav-yolo",
        "hyperparameters": {
            "epochs": args.epochs,
            "batch": args.batch,
            "imgsz": args.imgsz,
            "model": args.model,
            "workers": args.workers,
            "name": "crowdnav_yolo",
        },
        "max_run": args.max_runtime_hr * 3600,
    }

    if args.use_spot:
        estimator_kwargs["use_spot_instances"] = True
        estimator_kwargs["max_wait"] = args.max_runtime_hr * 3600 + 3600

    estimator = PyTorch(**estimator_kwargs)

    inputs = {"training": f"s3://{args.bucket}/{args.data_prefix}/"}

    print(f"\nJob name: {job_name}")
    print(f"Submitting training job...\n")
    estimator.fit(inputs=inputs, job_name=job_name, wait=True)

    print("=" * 60)
    print(f"[CrowdNav] Training Complete")
    print(f"Model artifacts: {estimator.model_data}")
    print(f"Logs: aws logs tail /aws/sagemaker/TrainingJobs --log-stream-name-prefix {job_name}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
