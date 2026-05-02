# AWS SageMaker Migration Plan — CrowdNav YOLOv8

End-to-end command reference for migrating the locally-trained CrowdNav YOLOv8 fine-tuning workload to AWS SageMaker. All shell snippets assume Windows PowerShell unless otherwise noted.

---

## Phase 0 — One-time AWS account & tool setup

### 0.1 Install AWS CLI v2

```powershell
winget install -e --id Amazon.AWSCLI
aws --version    # Expect: aws-cli/2.x ...
```

### 0.2 Create an IAM user with programmatic access (if not done)

In AWS Console → **IAM → Users → Create user**:
- Permissions: attach `AmazonS3FullAccess` and `AmazonSageMakerFullAccess`
- Create access key → save **Access Key ID** + **Secret Access Key**

```powershell
aws configure
# AWS Access Key ID:     <paste>
# AWS Secret Access Key: <paste>
# Default region:        ap-southeast-2   (Sydney; closest to UTS)
# Default output:        json
```

Verify:

```powershell
aws sts get-caller-identity
```

### 0.3 Create the SageMaker Execution Role (one-time)

In AWS Console → **IAM → Roles → Create role**:
- Trusted entity: **AWS service → SageMaker**
- Use case: SageMaker — Execution
- Permissions: `AmazonSageMakerFullAccess` + `AmazonS3FullAccess`
- Name: `SageMakerExecutionRole-CrowdNav`

Copy the resulting **Role ARN** — you will pass it to the launcher script.

```powershell
# Quick check (replace ACCOUNT_ID)
aws iam get-role --role-name SageMakerExecutionRole-CrowdNav
```

### 0.4 Install Python SDK locally

```powershell
cd "D:\UTS\2026-01\Deep Learning\Assignment 3"
pip install -U sagemaker boto3
```

---

## Phase 1 — Upload data to S3 (one-time, ~1–2 hours for 4 GB)

### 1.1 Create S3 bucket

```powershell
aws s3 mb s3://crowdnav-jrdb-data --region ap-southeast-2
```

### 1.2 Upload the prepared splits (already YOLO-format on disk)

```powershell
# Splits + data.yaml (small, fast)
aws s3 sync data\processed\splits `
  s3://crowdnav-jrdb-data/data/ `
  --exclude "*.cache" --exclude "*_pseudo_*"

# Verify
aws s3 ls s3://crowdnav-jrdb-data/data/ --recursive --summarize | Select-Object -Last 5
```

> **Note:** `splits/{train,val,test}/{images,labels}` already contains both image_0 and image_2 frames, prefixed and ready for YOLO training. No further packaging needed.

### 1.3 (Optional) Upload pretrained weights to skip the in-container download

```powershell
aws s3 cp yolov8l.pt s3://crowdnav-jrdb-data/weights/yolov8l.pt
# Or yolov8x.pt (136 MB) for the largest model
```

---

## Phase 2 — Verify SageMaker scripts

The repo now contains:

```
infra/sagemaker/
├── sagemaker_train.py     # entry point, runs INSIDE SageMaker container
├── sagemaker_launch.py    # launcher, runs LOCALLY
└── requirements.txt       # injected into the container
```

Quick sanity check:

```powershell
python infra/sagemaker/sagemaker_train.py --help
python infra/sagemaker/sagemaker_launch.py --help
```

---

## Phase 3 — Launch the training job

### 3.1 Choose an instance

| Instance | GPU | VRAM | $/hr (Sydney) | Use when |
|---|---|---|---|---|
| `ml.g4dn.xlarge` | T4 | 16 GB | $0.736 | Cheapest viable |
| **`ml.g5.xlarge`** ⭐ | A10G | 24 GB | $1.408 | **Recommended** for yolov8l, batch 32 |
| `ml.g5.2xlarge` | A10G | 24 GB | $1.690 | Faster CPU/RAM if data loading is the bottleneck |
| `ml.p3.2xlarge` | V100 | 16 GB | $4.284 | Fastest single-GPU; usually overkill |

### 3.2 Launch — recommended for **ml.g4dn.xlarge** (T4 16 GB)

```powershell
$ROLE = "arn:aws:iam::<ACCOUNT_ID>:role/SageMakerExecutionRole-CrowdNav"

python infra/sagemaker/sagemaker_launch.py `
  --role $ROLE `
  --bucket crowdnav-jrdb-data `
  --instance-type ml.g4dn.xlarge `
  --epochs 50 `
  --batch 32 `
  --imgsz 640 `
  --model yolov8m.pt `
  --workers 4 `
  --max-runtime-hr 8
```

**Hyperparameter rationale on T4 16 GB:**
- `yolov8m + batch 32` keeps VRAM ≈ 8 GB (50 % headroom) — best price/throughput.
- `yolov8l + batch 16` would also fit (~9 GB) but doubles runtime to ~11 h.
- `workers 4` matches the 4 vCPU on `g4dn.xlarge`.

### 3.2b Higher-accuracy alternative (yolov8l)

```powershell
python infra/sagemaker/sagemaker_launch.py `
  --role $ROLE `
  --bucket crowdnav-jrdb-data `
  --instance-type ml.g4dn.xlarge `
  --epochs 50 `
  --batch 16 `
  --imgsz 640 `
  --model yolov8l.pt `
  --workers 4 `
  --max-runtime-hr 14
```

### 3.3 (Optional) Use Spot Training (~50–70 % cheaper, may be interrupted)

```powershell
python infra/sagemaker/sagemaker_launch.py `
  --role $ROLE `
  --bucket crowdnav-jrdb-data `
  --use-spot `
  --epochs 50 --batch 32 --model yolov8l.pt
```

---

## Phase 4 — Monitor the running job

### 4.1 Live logs (best signal)

```powershell
# Replace <job-name> with the printed value from Phase 3
aws logs tail /aws/sagemaker/TrainingJobs `
  --log-stream-name-prefix <job-name> `
  --follow
```

### 4.2 Status & metrics (CLI)

```powershell
# List jobs (last 10)
aws sagemaker list-training-jobs --max-results 10 `
  --query "TrainingJobSummaries[].[TrainingJobName,TrainingJobStatus,TrainingTimeInSeconds]" `
  --output table

# Detailed status
aws sagemaker describe-training-job --training-job-name <job-name> `
  --query "{Status:TrainingJobStatus, Time:TrainingTimeInSeconds, Output:ModelArtifacts.S3ModelArtifacts}"
```

### 4.3 Console UI

`https://ap-southeast-2.console.aws.amazon.com/sagemaker/home?region=ap-southeast-2#/jobs`

CloudWatch shows GPU utilisation, memory, and live throughput.

---

## Phase 5 — Pull results back to local

### 5.1 Find the model artifact location

```powershell
aws sagemaker describe-training-job --training-job-name <job-name> `
  --query "ModelArtifacts.S3ModelArtifacts" --output text
```

The output is `s3://crowdnav-jrdb-data/output/<job-name>/output/model.tar.gz`.

### 5.2 Download & extract

```powershell
$JOB = "<job-name>"
mkdir runs\sagemaker -Force | Out-Null

aws s3 cp "s3://crowdnav-jrdb-data/output/$JOB/output/model.tar.gz" `
  "runs\sagemaker\$JOB.tar.gz"

tar -xzf "runs\sagemaker\$JOB.tar.gz" -C "runs\sagemaker"
ls runs\sagemaker\
# Expect: best.pt, last.pt, results.csv, results.png, final_val_metrics.txt, ...
```

### 5.3 Inspect the metrics

```powershell
Get-Content runs\sagemaker\final_val_metrics.txt
Import-Csv runs\sagemaker\results.csv |
  Select-Object epoch, "metrics/mAP50(B)", "metrics/mAP50-95(B)", "metrics/precision(B)", "metrics/recall(B)" |
  Format-Table
```

---

## Phase 6 — Local evaluation with the cloud-trained model

```powershell
python scripts/train_yolo.py `
  --model-cfg runs\sagemaker\best.pt `
  --data-yaml data\processed\splits\data.yaml `
  --epochs 0 --imgsz 640 `
  --validate
# (epochs 0 + --validate runs val only)
```

Or via Ultralytics CLI:

```powershell
yolo val model=runs\sagemaker\best.pt data=data\processed\splits\data.yaml imgsz=640
```

---

## Phase 7 — Deployment (export for inference)

```powershell
# ONNX (cross-platform inference, FastAPI/edge deployment)
yolo export model=runs\sagemaker\best.pt format=onnx imgsz=640

# TorchScript (C++ / mobile)
yolo export model=runs\sagemaker\best.pt format=torchscript imgsz=640
```

---

## Cost summary (Sydney region, on-demand)

| Phase | Service | Approx cost |
|---|---|---|
| 1 | S3 storage (4 GB / month) | ~$0.10 |
| 1 | S3 PUT operations (~50 k) | ~$0.25 |
| 3 | Training on **ml.g4dn.xlarge × 6 h** (yolov8m, batch 32) | **~$4.4** |
| 3 (alt) | Training on ml.g4dn.xlarge × 11 h (yolov8l, batch 16) | ~$8.1 |
| 3 (spot) | Same with `--use-spot` (≈ 50 % off) | **~$2.2** |
| 5 | S3 GET + egress (200 MB) | ~$0.02 |
| **Total per run** | — | **≈ $4.5 (or $2.5 with spot)** |

Stop charges by deleting unused S3 objects when finished:

```powershell
aws s3 rm s3://crowdnav-jrdb-data --recursive
aws s3 rb s3://crowdnav-jrdb-data
```

---

## Troubleshooting checklist

| Symptom | Fix |
|---|---|
| `AccessDenied` on `s3 cp` | IAM user missing `AmazonS3FullAccess` |
| `ResourceLimitExceeded` on launch | Quota — request `ml.g5.xlarge` quota in *Service Quotas* console |
| Training stuck at "Starting" | First container pull on a region can take 5–10 min |
| `CUDA out of memory` mid-training | Reduce `--batch` (try 16); increase `--imgsz`-aware safety |
| Spot job killed at 30 % | Re-launch without `--use-spot` or rely on the saved checkpoint |
| `data.yaml` path mismatch | `sagemaker_train.py` rewrites it on container start; verify mounted dir matches `SM_CHANNEL_TRAINING` |
