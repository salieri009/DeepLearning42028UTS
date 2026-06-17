"""Launch a SageMaker PyTorch training job for CrowdNav YOLOv8 fine-tuning.

Run LOCALLY (not inside SageMaker). Uploads the repo root as the source bundle
(see ``.sagemakerignore``), installs ``crowdnav-train``, and runs
``infra/sagemaker/sagemaker_train.py`` inside the container.

Prerequisites:
- AWS credentials configured (`aws configure` or environment variables)
- IAM role with SageMaker execution permissions
- Data uploaded to S3 (see docs/runbooks/SageMaker_Migration_Plan.md)
- ``pip install -e ./train sagemaker boto3``

Usage:
  python infra/sagemaker/sagemaker_launch.py \\
    --role arn:aws:iam::ACCOUNT_ID:role/SageMakerExecutionRole \\
    --bucket crowdnav-jrdb-data
"""

from __future__ import annotations

import argparse
import time
from pathlib import Path

from src.training.hyperparams import default_training_presets

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_HP = default_training_presets()["sagemaker_managed_job"]

_DATASET_PREFIX = {
    "person": "data",
    "3class": "data_3class",
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--role",
        required=True,
        help="SageMaker execution role ARN",
    )
    p.add_argument(
        "--bucket",
        required=True,
        help="S3 bucket containing training data (train/val/test under prefix)",
    )
    p.add_argument(
        "--data-prefix",
        default=None,
        help="S3 prefix override (default: data for person, data_3class for --dataset-variant 3class)",
    )
    p.add_argument(
        "--dataset-variant",
        choices=sorted(_DATASET_PREFIX),
        default="person",
        help="Dataset layout passed to sagemaker_train.py (default: person / nc:1)",
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
        help="SageMaker training instance (default: ml.g5.xlarge)",
    )
    p.add_argument("--epochs", type=int, default=_DEFAULT_HP.epochs)
    p.add_argument("--batch", type=int, default=_DEFAULT_HP.batch)
    p.add_argument("--imgsz", type=int, default=_DEFAULT_HP.imgsz)
    p.add_argument("--model", default=_DEFAULT_HP.model)
    p.add_argument("--workers", type=int, default=_DEFAULT_HP.workers)
    p.add_argument("--patience", type=int, default=_DEFAULT_HP.patience)
    p.add_argument(
        "--save-period",
        type=int,
        default=_DEFAULT_HP.save_period,
        help="Checkpoint every N epochs",
    )
    p.add_argument(
        "--max-runtime-hr",
        type=int,
        default=12,
        help="Max training runtime in hours",
    )
    p.add_argument(
        "--use-spot",
        action="store_true",
        help="Use SageMaker Managed Spot Training",
    )
    p.add_argument(
        "--job-name",
        default=None,
        help="Custom training job name",
    )
    return p.parse_args()


def resolve_data_prefix(args: argparse.Namespace) -> str:
    if args.data_prefix:
        return args.data_prefix.strip("/")
    return _DATASET_PREFIX[args.dataset_variant]


def main() -> int:
    args = parse_args()
    data_prefix = resolve_data_prefix(args)

    from sagemaker.pytorch import PyTorch

    print("=" * 60)
    print("[CrowdNav] Launching SageMaker training job")
    print("=" * 60)
    print(f"Role:            {args.role}")
    print(f"Bucket:          s3://{args.bucket}")
    print(f"Data prefix:     {data_prefix}/")
    print(f"Dataset variant: {args.dataset_variant}")
    print(f"Instance:        {args.instance_type}")
    print(f"Model:           {args.model}")
    print(f"Epochs/Batch:    {args.epochs} / {args.batch}")
    print(f"Spot pricing:    {args.use_spot}")
    print("=" * 60)

    job_name = args.job_name or f"crowdnav-yolo-{int(time.time())}"
    output_path = f"s3://{args.bucket}/output"

    estimator_kwargs = {
        "entry_point": "infra/sagemaker/sagemaker_train.py",
        "source_dir": str(_REPO_ROOT),
        "dependencies": ["infra/sagemaker/requirements.txt"],
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
            "patience": args.patience,
            "save-period": args.save_period,
            "name": "crowdnav_yolo",
            "dataset-variant": args.dataset_variant,
        },
        "max_run": args.max_runtime_hr * 3600,
    }

    if args.use_spot:
        estimator_kwargs["use_spot_instances"] = True
        estimator_kwargs["max_wait"] = args.max_runtime_hr * 3600 + 3600

    estimator = PyTorch(**estimator_kwargs)
    inputs = {"training": f"s3://{args.bucket}/{data_prefix}/"}

    print(f"\nJob name: {job_name}")
    print("Submitting training job...\n")
    estimator.fit(inputs=inputs, job_name=job_name, wait=True)

    print("=" * 60)
    print("[CrowdNav] Training Complete")
    print(f"Model artifacts: {estimator.model_data}")
    print(f"Logs: aws logs tail /aws/sagemaker/TrainingJobs --log-stream-name-prefix {job_name}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
