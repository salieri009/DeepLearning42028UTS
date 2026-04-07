from __future__ import annotations

import time

from src.utils.clearml_setup import init_clearml_task


def main() -> None:
    info = init_clearml_task(
        project_name="UTS-DeepLearning-Assignment3",
        task_name="clearml-smoketest",
        tags=["assignment3", "smoketest"],
        params={"seed": 42, "epochs": 3},
    )
    print(f"ClearML task initialized: {info}")

    # Minimal scalar logging example
    from clearml import Logger

    logger = Logger.current_logger()
    for epoch in range(1, 4):
        loss = 1.0 / epoch
        acc = epoch / 3.0
        logger.report_scalar(title="train", series="loss", value=loss, iteration=epoch)
        logger.report_scalar(title="train", series="acc", value=acc, iteration=epoch)
        time.sleep(0.1)


if __name__ == "__main__":
    main()
