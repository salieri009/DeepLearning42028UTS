# SageMaker training (CrowdNav)

Managed YOLO fine-tuning on AWS SageMaker. Uses the same **`TrainPipeline`** as local [`train/scripts/train_yolo.py`](../../train/scripts/train_yolo.py) via editable install of **`crowdnav-train`**.

## Files

| File | Runs where | Role |
|------|------------|------|
| [`sagemaker_launch.py`](sagemaker_launch.py) | Local laptop | Submits PyTorch estimator job |
| [`sagemaker_train.py`](sagemaker_train.py) | SageMaker container | Entry point — `TrainPipeline.train()` + validation |
| [`requirements.txt`](requirements.txt) | SM container | `-e ./train` + pinned `ultralytics` |

## Source bundle

The launcher uploads the **repository root** as `source_dir`, excluding large paths via [`.sagemakerignore`](../../.sagemakerignore) (`data/`, `application/`, `runs/`, etc.).

Hyperparameter defaults come from `default_training_presets()["sagemaker_managed_job"]` in [`train/src/training/hyperparams.py`](../../train/src/training/hyperparams.py).

## Quick start

Prerequisites: `pip install -e ./train sagemaker boto3`, AWS credentials, S3 data (see [`docs/runbooks/SageMaker_Migration_Plan.md`](../../docs/runbooks/SageMaker_Migration_Plan.md)).

```powershell
python infra/sagemaker/sagemaker_launch.py `
  --role arn:aws:iam::ACCOUNT:role/SageMakerExecutionRole-CrowdNav `
  --bucket crowdnav-jrdb-data `
  --instance-type ml.g4dn.xlarge
```

Override presets for a shorter smoke job:

```powershell
python infra/sagemaker/sagemaker_launch.py `
  --role $ROLE --bucket crowdnav-jrdb-data `
  --epochs 1 --model yolov8m.pt --batch 16
```

## Dataset variants

| `--dataset-variant` | S3 prefix (default) | `data.yaml` when generated |
|---------------------|---------------------|----------------------------|
| `person` (default) | `data/` | `nc: 1`, `person` |
| `3class` | `data_3class/` | `nc: 3`, `person`, `wheelchair`, `luggage` |

Upload 3-class splits to `s3://<bucket>/data_3class/` before launching with `--dataset-variant 3class`. If `data.yaml` already exists in the S3 channel, it is respected (only the `path:` key is patched to the container mount).

## Artifact handoff

After the job completes:

```powershell
.\infra\scripts\fetch_best_pt.ps1 -JobName crowdnav-yolo-1234567890
cd application
docker compose up --build
```

## Version lock

Training and inference must use the same **ultralytics** version when loading `best.pt`. See [`infra/versions.lock.toml`](../versions.lock.toml).
