# UTS Deep Learning 42028 — Assignment 3

**Subject:** 42028 Deep Learning  
**Semester:** 2026 Semester 1  
**University:** University of Technology Sydney (UTS)

---

## 🚀 Project: Crowd Detection and Accessibility Navigation

> A computer vision system that assists individuals with disabilities in navigating crowded transport hubs (airports, train stations, public spaces) using real-time crowd density mapping and obstacle detection.

### Team Members

| Name | Student ID |
|------|-----------|
| Jungowok | 25167747 |
| Phoi Gia Vuong | 25736012 |
| Chihyun | 14707133 |

### Project Abstract

Navigating through crowded transport hubs and public spaces can be highly challenging for individuals with disabilities. This project develops a **CNN-based crowd detection and analysis system** that provides real-time insights into crowd density, directional flow, and accessibility obstacles. The system identifies optimal accessible routes and alerts users to congested areas, enhancing safety, mobility, and independence while travelling.

**Approach:**
- **Object Detection:** YOLO (v8/v10) via transfer learning — people, wheelchairs, obstacles
- **Crowd Density Estimation:** CSRNet for density maps in heavily occluded scenes
- **Datasets:** ShanghaiTech / UCF-QNRF (crowd), COCO (obstacles)
- **Output:** Accessible GUI (Mobile/Web App) with visual and audio feedback

---

## Assignment-3 Structure

### Repository Layout

```
Assignment-3/
├── Part-A/    # Project Proposal (submit individually)
│   ├── README.md
│   └── Assignment-3-PartA-Draft.md
├── Part-B/    # Intermediate Deliverable 1 — Dataset & Architecture
├── Part-C/    # Intermediate Deliverable 2 — Initial Results
├── Part-D/    # Intermediate Deliverable 3 — GUI Design
├── Part-E/    # Final Project Report (submit individually)
└── Part-G/    # Oral Defense Materials
```

### Submission Summary

| Part | Description | Submitted By |
|------|-------------|--------------|
| **Part-A** | Project Proposal | **Every student individually** |
| **Part-B** | Intermediate Deliverable 1 | One per team |
| **Part-C** | Intermediate Deliverable 2 | One per team |
| **Part-D** | Intermediate Deliverable 3 | One per team |
| **Part-E** | Final Project Report | **Every student individually** |
| **Part-G** | Oral Defense | **Every student individually** |

### File Naming Convention

```
Assignment-3-<Part>-<StudentName>-<StudentID>.doc/pdf
```

**Example:** `Assignment-3-PartA-NabinSharma-12345678.pdf`

---

## Key Rules

- Group size: **exactly 3 students** (min and max)
- Groups can include students from **different tutorial/lab sessions**
- Network **training is required** — pre-trained model alone is not accepted (transfer learning is permitted)
- Oral Defense (Part-G) is **mandatory** for every student — project is **INCOMPLETE** without it
- Intermediate deadlines (Part-B, C, D) have **no late penalties**, but all work must be submitted before the **final deadline**
- Part-E **Individual Contribution** section must be unique per student

---

## FAQ

<details>
<summary><strong>Are intermediate deadlines (Part-B, C, D) strict?</strong></summary>

No late penalties for intermediate parts, but **everything must be submitted before the final project deadline**. Reference deadlines are on the Week-1 Introduction slides (slide-7).
</details>

<details>
<summary><strong>Can I use YOLO or other frameworks?</strong></summary>

Yes. Any object detection or image classification framework is allowed. **Training of the network is required** — transfer learning is permitted, but you must train the network.
</details>

<details>
<summary><strong>What if I can't find a team?</strong></summary>

Still submit Part-A individually. The teaching team will assist in forming groups after Part-A submissions.
</details>

<details>
<summary><strong>Does Part-E require separate reports per student?</strong></summary>

Yes. All members submit individually. Content and results can match, but the **Individual Contribution (Appendix A)** section must reflect each student's personal contribution.
</details>

<details>
<summary><strong>What is assessed in the Oral Defense (Part-G)?</strong></summary>

Content from **Week-1 to Week-11** plus your project. The oral defense is mandatory — the project is incomplete without it.
</details>

---

## Contact

For specific questions, contact the **subject coordinator via email** as soon as possible.
