# `/data`

This directory contains all data for the CrowdNav deep learning project.

## Structure
* `/raw`: Immutable, original datasets. This directory **MUST NOT** be synced to Git. (Managed by DVC)
* `/processed`: Cleaned, augmented, resized data ready for model training. (Managed by DVC)

## Dataset Details

| Dataset Name | Link | Description & Justification |
| :--- | :--- | :--- |
| **ShanghaiTech (Part A & B)** & **UCF-QNRF** | [ShanghaiTech](https://www.kaggle.com/datasets/tthien/shanghaitech), [UCF-QNRF](https://www.crcv.ucf.edu/data/ucf-qnrf/) | **Crowd counting and density mapping:** for training CNNs to evaluate varying levels of crowd density, allowing the system to identify highly congested environments or unnavigable paths. |
| **COCO (2017)** & **Open Images Dataset** | [COCO](https://cocodataset.org/), [Open Images](https://storage.googleapis.com/openimages/web/index.html) | **Obstacle detection:** for filtering specific logistical obstacles such as luggage, backpacks, wheelchairs, and strollers. |
| **JRDB (JackRabbot Dataset)** | [JRDB](https://jrdb.erc.monash.edu/) | **Proximity and POV:** provides first-person POV RGB-D data from a lower vantage point. Essential for simulating a wheelchair perspective and training the model on spatial distance metrics. |
| **Custom POV Dataset** | N/A (To be collected) | **Fine-tuning:** a small-scale dataset of wheelchair-perspective crowd and obstacle footage. Captured via university-loaned RGB-D camera to optimize the pre-trained models. |

## Download Instructions

Download each dataset manually, then place it under `data/raw/` using the structure below.

<details>
<summary><strong>한국어 안내 (접기/펼치기)</strong></summary>

각 데이터셋은 **수동으로 다운로드**한 후 `data/raw/` 아래 지정된 폴더에 배치합니다.

### 1. COCO 2017 (~6GB subset)
> **Target Classes:** `person`, `backpack`, `suitcase`, `bench`, `chair`
1. [COCO Downloads](https://cocodataset.org/#download)에서 다음 파일 다운로드:
   - `2017 Train images` (18GB) — 또는 필요한 클래스만 필터링된 subset 사용
   - `2017 Val images` (1GB)
   - `2017 Train/Val annotations` (241MB)
2. 다운로드 후 `data/raw/coco/`에 압축 해제

### 2. Open Images v7 — Wheelchair (~500MB)
> **Target Class:** `Wheelchair`
1. [Open Images](https://storage.googleapis.com/openimages/web/index.html)에서 Wheelchair 클래스만 선택 다운로드
2. 또는 [FiftyOne](https://docs.voxel51.com/integrations/open-images.html)을 사용하여 CLI로 다운로드:
   ```bash
   pip install fiftyone
   fiftyone zoo datasets load open-images-v7 --split train --classes Wheelchair
   ```
3. 다운로드 후 `data/raw/openimages/`에 배치

### 3. ShanghaiTech Part A & B (~300MB)
1. [Kaggle](https://www.kaggle.com/datasets/tthien/shanghaitech)에서 직접 다운로드 (Kaggle 로그인 필요)
2. 또는 Kaggle CLI 사용:
   ```bash
   pip install kaggle
   kaggle datasets download -d tthien/shanghaitech -p data/raw/shanghaitech --unzip
   ```
3. 다운로드 후 `data/raw/shanghaitech/`에 배치

### 4. JRDB — JackRabbot Dataset (~50GB)
> ⚠️ **계정 등록 필수**
1. [JRDB 포털](https://jrdb.erc.monash.edu/)에서 계정 등록 후 로그인
2. 필요한 데이터 split 선택하여 다운로드
3. 다운로드 후 `data/raw/jrdb/`에 배치

### 5. Custom POV Dataset
- 대학 RGB-D 카메라로 직접 촬영 예정
- 수집 후 `data/raw/custom_pov/`에 배치

## Expected `raw/` Structure

```
data/raw/
├── coco/
│   ├── train2017/
│   ├── val2017/
│   └── annotations/
├── openimages/
│   ├── train/
│   └── validation/
├── shanghaitech/
│   ├── part_A/
│   └── part_B/
├── jrdb/
│   └── ...
└── custom_pov/
    └── ...
```

</details>
