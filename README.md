<p align="center">
  <img src="./project_logo.svg" alt="Project Logo" width="120" />
  <h1 align="center">Crowd Detection and Accessibility Navigation</h1>
  <p align="center">
    <strong>Computer vision system for navigating crowded transport hubs.</strong>
    <br />
    <br />
    <a href="#project-abstract">Explore the docs</a>
    ·
    <a href="#faq">View FAQ</a>
    ·
    <a href="#contact">Contact</a>
  </p>
</p>

---

![Assignment Status](https://img.shields.io/badge/Assignment-Part_A_Submission_Pending-orange?style=flat-square)
![Subject](https://img.shields.io/badge/Subject-Deep_Learning_42028-blue?style=flat-square)
![University](https://img.shields.io/badge/University-UTS_2026-002366?style=flat-square)

> A computer vision system that assists individuals with disabilities in navigating crowded transport hubs (airports, train stations, public spaces) using real-time crowd density mapping and obstacle detection.

<details>
<summary><strong>Table of Contents</strong></summary>

- [Team Members](#team-members)
- [Project Abstract](#project-abstract)
- [Additional Support Required](#additional-support-required)
- [Repository Layout](#repository-layout)
- [Submission Summary](#submission-summary)
- [File Naming Convention](#file-naming-convention)
- [Key Rules](#key-rules)
- [FAQ](#faq)
- [Contact](#contact)
</details>

---

## Team Members

| Name | Student ID | Role (Equally Distributed DL Workload) |
|------|------------|-----------------------------------------|
| TBD  | TBD        | **Model 1 (Crowd Density - CSRNet):** Dataset prep (ShanghaiTech/QNRF), continuous density map generation, & model training. |
| TBD  | TBD        | **Model 2 (Obstacle Detection - YOLO):** Transfer learning on COCO, bounding box regression, & latency optimization. |
| TBD  | TBD        | **Algorithm Design & Multi-Model Inference Logic:** Developing spatial risk-scoring formulas, syncing Dual-model (YOLO+CSRNet) inference latency handling, and building the backend routing API. |

> **Note:** The specific role assignments above are tentative and will be finalized after further team discussion.

---

## Project Abstract

Navigating densely populated public spaces and transport hubs presents significant barriers to safe and independent travel for individuals with disabilities. In dynamic environments, unpredictable crowd behaviours and transient physical obstacles often compromise accessibility and user safety. To address these challenges, this project introduces a crowd detection and analysis system driven by **Convolutional Neural Networks (CNNs)**. The proposed computer vision framework is engineered to process real-time environmental data, delivering actionable insights into spatial dynamics. Specifically, the system accurately quantifies crowd density, maps directional pedestrian flow, and identifies temporary or permanent accessibility obstacles. By synthesising these real-time metrics, the algorithmic framework dynamically calculates optimal accessible routes tailored to the specific mobility requirements of the user. Furthermore, it incorporates an early warning mechanism to proactively alert users to highly congested zones and potential hazards. Preliminary evaluations suggest that this CNN-based approach significantly mitigates navigation difficulties in high-traffic areas. Ultimately, the deployment of this intelligent spatial analysis system promises to enhance the safety, mobility, and overall independence of individuals with disabilities, fostering more inclusive urban infrastructure and accessible public transport networks.

### Approach
*   **Object Detection:** YOLO (v8/v10) via transfer learning — targeting people, wheelchairs, and localized obstacles.
*   **Crowd Density Estimation:** CSRNet for generating continuous density maps in heavily occluded scenes.
*   **Output:** Accessible GUI (Mobile/Web App) providing visual and audio feedback.

### Dataset Details
*   **Crowd Counting & Density Mapping:** **[ShanghaiTech Dataset (Part A & B)](https://www.dropbox.com/scl/fi/dkj5kulc9zj0rzesslck8/ShanghaiTech_Crowd_Counting_Dataset.zip?rlkey=ymbcj50ac04uvqn8p49j9af5f&dl=0)** and **[UCF-QNRF](https://www.crcv.ucf.edu/data/ucf-qnrf/)**. Crucial for training CNNs on varying levels of crowd density, from sparse corridors to highly congested environments.
*   **Obstacle Detection:** **[COCO Dataset (2017)](https://cocodataset.org/#download)**, filtered for specific logistical obstacles (e.g., luggage, backpacks, wheelchairs) to train the YOLO model via transfer learning.

## Additional Support Required

To successfully achieve the project outcomes, the team anticipates requiring the following support:

*   **Computational Resources:** Access to UTS high-performance computing (HPC) clusters or cloud GPU resources to facilitate the training of computationally intensive deep learning models (such as YOLO and CSRNet) within the project timeframe.
*   **Ethics Clearance Guidance:** Advice on UTS ethics approval procedures if the team determines that capturing supplemental custom video footage within university spaces is necessary for localized validation testing.

---

## Repository Layout

The project follows a structured directory format to align with the assignment deliverables:

```text
.
├── Assignment-3/
│   ├── Part-A/    # Project Proposal (submit individually)
│   │   ├── README.md
│   │   └── Assignment-3-PartA-Draft.md
│   ├── Part-B/    # Intermediate Deliverable 1 — Dataset & Architecture
│   ├── Part-C/    # Intermediate Deliverable 2 — Initial Results
│   ├── Part-D/    # Intermediate Deliverable 3 — GUI Design
│   ├── Part-E/    # Final Project Report (submit individually)
│   └── Part-G/    # Oral Defense Materials
├── PROJECTS/      # Project Management & Additional Docs
│   ├── PRD.md     # Product Requirements Document
│   └── TechSpec.md # Technical Specifications
└── README.md
```

---

## Submission Summary

| Part   | Description                | Submitted By                 | Status |
|--------|----------------------------|------------------------------|--------|
| **Part-A** | Project Proposal           | **Every student individually** | Pending |
| **Part-B** | Intermediate Deliverable 1 | One per team                 | TBD |
| **Part-C** | Intermediate Deliverable 2 | One per team                 | TBD |
| **Part-D** | Intermediate Deliverable 3 | One per team                 | TBD |
| **Part-E** | Final Project Report       | **Every student individually** | TBD |
| **Part-G** | Oral Defense               | **Every student individually** | TBD |

### File Naming Convention

```bash
Assignment-3-<Part>-<StudentName>-<StudentID>.<doc/pdf>
```

**Example:** `Assignment-3-PartA-NabinSharma-12345678.pdf`

---

## Key Rules

- **Group size:** Exactly **3 students** (min and max).
- **Session Flexibility:** Groups can include students from different tutorial/lab sessions.
- **Model Training:** Network **training is required** — pre-trained model alone is not accepted (transfer learning is permitted).
- **Oral Defense (Part-G):** **Mandatory** for every student — project is **INCOMPLETE** without it.
- **Deadlines:** Intermediate deadlines (Part-B, C, D) have no late penalties, but all work must be submitted before the **final deadline**.
- **Individual Contribution:** The Part-E individual contribution section must be unique per student.

---

## FAQ

<details>
<summary><strong>Are intermediate deadlines (Part-B, C, D) strict?</strong></summary>
<br>
No late penalties for intermediate parts, but <b>everything must be submitted before the final project deadline</b>. Reference deadlines are on the Week-1 Introduction slides (slide-7).
</details>

<details>
<summary><strong>Can I use YOLO or other frameworks?</strong></summary>
<br>
Yes. Any object detection or image classification framework is allowed. <b>Training of the network is required</b> — transfer learning is permitted, but you must train the network yourself.
</details>

<details>
<summary><strong>What if I can't find a team?</strong></summary>
<br>
Still submit Part-A individually. The teaching team will assist in forming groups after Part-A submissions.
</details>

<details>
<summary><strong>Does Part-E require separate reports per student?</strong></summary>
<br>
Yes. All members submit individually. Content and results can match, but the <b>Individual Contribution (Appendix A)</b> section must reflect each student's personal contribution.
</details>

<details>
<summary><strong>What is assessed in the Oral Defense (Part-G)?</strong></summary>
<br>
Content from <b>Week-1 to Week-11</b> plus your project. The oral defense is mandatory — the project is incomplete without it.
</details>

---

## Contact

For specific questions regarding the assignment specifications, contact the **subject coordinator via email** as soon as possible.

<br />

<p align="center">
  <a href="https://github.com/Abblix/Oidc.Server"><img src="https://img.shields.io/badge/Designed%20inspired%20by-Oidc.Server-lightgrey?style=flat-square" alt="Design Credit" /></a>
  <br />
  <strong>UTS Deep Learning (42028) • Semester 1, 2026</strong>
</p>
