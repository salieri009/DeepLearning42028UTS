# Human Object Detection Test Dataset Requirement

## Requirement / 요구사항
- Secure **20 test dataset samples** for human object detection.
- 사람 객체 탐지를 위한 **테스트 데이터셋 샘플 20개**를 확보한다.

## Purpose / 목적
- Validate baseline model performance on human-object detection under consistent evaluation conditions.
- 일관된 평가 조건에서 사람 객체 탐지 모델의 기본 성능을 검증한다.

## Minimum Annotation Fields / 최소 어노테이션 필드
Each sample must include:
- image (file path or ID)
- box coordinates: x_min, y_min, x_max, y_max
- class (must indicate human/person)

각 샘플은 다음을 포함해야 한다:
- image (파일 경로 또는 ID)
- box 좌표: x_min, y_min, x_max, y_max
- class (human/person)

## Split Policy / 분할 정책
- Test-only dataset.
- No training/validation use is allowed for these 20 samples.

- 테스트 전용 데이터셋.
- 본 20개 샘플은 학습/검증에 사용하지 않는다.

## Quality Checklist / 품질 체크리스트
- Image is readable and not corrupted.
- Human object is visible and label matches image.
- Bounding box tightly encloses target.
- Coordinates are valid (x_min < x_max, y_min < y_max) and inside image bounds.
- Class label schema is consistent (person or approved equivalent).

- 이미지가 정상적으로 열리고 손상되지 않았다.
- 사람 객체가 식별 가능하며 라벨이 이미지와 일치한다.
- 바운딩 박스가 타깃을 적절히 포함한다.
- 좌표가 유효하고 이미지 경계 내에 있다.
- 클래스 라벨 체계가 일관된다.

## Done Criteria / 완료 기준
- 20/20 samples collected.
- All samples contain required fields.
- Quality checklist passed for every sample.
- Dataset is versioned and ready for test execution.

- 20/20 샘플 수집 완료.
- 모든 샘플이 필수 필드를 포함.
- 모든 샘플이 품질 체크 통과.
- 데이터셋이 버전 관리되고 테스트 실행 준비 완료.

## Sample Tracking Checklist (20)
- [ ] Sample 01
- [ ] Sample 02
- [ ] Sample 03
- [ ] Sample 04
- [ ] Sample 05
- [ ] Sample 06
- [ ] Sample 07
- [ ] Sample 08
- [ ] Sample 09
- [ ] Sample 10
- [ ] Sample 11
- [ ] Sample 12
- [ ] Sample 13
- [ ] Sample 14
- [ ] Sample 15
- [ ] Sample 16
- [ ] Sample 17
- [ ] Sample 18
- [ ] Sample 19
- [ ] Sample 20
