# `/data`

This directory contains all data for the CrowdNav deep learning project.

## Structure
- `/raw`: Immutable, original datasets. This directory **MUST NOT** be synced to Git. (Managed by DVC)
- `/processed`: Cleaned, augmented, resized data ready for model training. (Managed by DVC)

## Dataset Details

| Dataset Name | Link | Description & Justification |
| :--- | :--- | :--- |
| **ShanghaiTech (Part A & B)** & **UCF-QNRF** | [ShanghaiTech](https://www.kaggle.com/datasets/tthien/shanghaitech), [UCF-QNRF](https://www.crcv.ucf.edu/data/ucf-qnrf/) | **Crowd counting and density mapping:** for training CNNs to evaluate varying levels of crowd density, allowing the system to identify highly congested environments or unnavigable paths. |
| **COCO (2017)** & **Open Images Dataset** | [COCO](https://cocodataset.org/), [Open Images](https://storage.googleapis.com/openimages/web/index.html) | **Obstacle detection:** for filtering specific logistical obstacles such as luggage and backpacks or wheelchairs, strollers. |
| **JRDB (JackRabbot Dataset)** | [JRDB](https://jrdb.erc.monash.edu/) | **Proximity and POV:** provides first-person POV RGB-D data from a lower vantage point. Essential for simulating a wheelchair perspective and training the model on spatial distance metrics. |
| **Custom POV Dataset** | N/A (To be collected) | **Fine-tuning:** a small-scale dataset of 'wheelchair-perspective' crowd and obstacle footage. Captured via university-loaned RGB-D camera to optimize the pre-trained models. |

*Note: Raw large datasets should be downloaded manually or via scripts in `src/data` and placed into the `raw/` folder.*
