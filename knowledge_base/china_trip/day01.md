# Day 1 — China Medical AI Training Program
## Location: Zhongshan Hospital, Fudan University, Shanghai

---

## SESSION 1: Opening — Zhongshan Hospital National AI Medical Pioneer

**Host:** Gu Jianying — Party Secretary, Zhongshan Hospital, Fudan University

**Zhongshan Hospital Overview:**
- Founded 1937, affiliated with Fudan University
- 6.2 million outpatients per year
- 280,000 inpatients per year
- 3,600+ beds
- 76 clinical specialties
- 182 sub-specialties
- Designated **National AI Pilot Base** for medical AI

**Key AI Achievements:**
- First hospital in China to deploy full AI-assisted diagnostic pipeline
- AI-assisted endoscopy detecting polyps in real time with >95% sensitivity
- AI radiology reading integrated into daily clinical workflow
- Reduced average radiology report turnaround from 4 hours to 45 minutes

**National Strategy Context:**
- China has made AI in healthcare a top national priority under "Healthy China 2030"
- Government investment: over ¥10 billion earmarked for medical AI infrastructure
- Zhongshan serves as the model hospital for national AI deployment standards
- Their protocols are being replicated across all 650+ affiliated hospitals nationwide

**Key Takeaway (Haitham):**
The scale here is staggering — 6.2 million outpatients means more patients per year than most Gulf countries' entire healthcare system. The AI integration isn't experimental here; it's production. Every radiologist, every endoscopist uses AI as a second reader. No opt-in. It's the default.

---

## SESSION 2: Huawei Healthcare Corps

**Presenter:** Senior Huawei Healthcare Solutions Architect

**Huawei Healthcare Division Stats:**
- Launched dedicated Healthcare Corps: **March 2025**
- Active in **110+ countries**
- Serving **5,600+ healthcare organizations** worldwide
- **HAIP (Huawei AI in Healthcare Platform)** — General Availability: **April 2026**

**Core Products Presented:**
1. **HiCure Platform** — End-to-end AI clinical decision support
2. **Medical Imaging AI Suite** — CT, MRI, PET-CT analysis
3. **Hospital Operations Intelligence** — Patient flow, bed management, staff scheduling
4. **5G Medical Network** — Low-latency connections for OR robotics and remote surgery

**Infrastructure Claims:**
- Huawei's medical AI runs on their own Ascend NPU chips (not NVIDIA) — domestically produced
- Claimed 40% lower inference cost vs. GPU-based competitors
- All data stays on-premise or in Huawei private cloud — key selling point for regulated markets

**Cybersecurity Angle:**
- Dedicated healthcare cybersecurity layer built into every deployment
- Mention of zero-trust architecture for hospital networks
- ISO 27001 + HIPAA-ready compliance framework

**Key Takeaway (Haitham):**
Huawei is positioning this as an alternative to the US/European tech stack — specifically targeting markets that can't or won't use American cloud providers. For healthcare organizations under data sovereignty regulations (like Saudi Arabia, UAE), this is a real option. The 5,600 organizations number is bigger than I expected.

---

## SESSION 3: United Imaging Healthcare (UIH)

**Presenter:** UIH International Business Director

**Company Overview:**
- Founded 2011, headquartered in Shanghai
- Operates in **100+ countries**
- Installed base: **~4,000 institutions** worldwide
- Listed on Shanghai Stock Exchange 2022

**Product Highlights:**
- **World's first total-body PET-CT scanner** — images entire body in 15–30 seconds
- **uMR Jupiter 5.0T MRI** — highest field strength commercially available MRI
- Full CT/MRI/PET/RT portfolio: 30+ product lines

**Regulatory Approvals:**
- **15 FDA** clearances (United States)
- **31 CE** marks (Europe)
- **44 NMPA** approvals (China National Medical Products Administration)
- Combined: most regulatory approvals of any Chinese medical device company

**AI Integration:**
- **uAI Suite** — embedded AI in every scanner:
  - Auto-positioning: patient set up time reduced from 8 min → 2 min
  - Auto-contour (RT planning): from 2 hours manual → 8 minutes AI-assisted
  - Real-time image quality control: technologist alerted immediately if scan needs redo
  - Dose optimization: AI adjusts scan parameters per patient body type

**Key Takeaway (Haitham):**
The total-body PET-CT is genuinely remarkable. Standard PET-CT scans one section at a time — 20–30 minutes for whole body. Their scanner does it in one pass, 15 seconds, at a fraction of the radiation dose. The clinical implications for oncology staging are massive. We should be tracking this for our radiology procurement cycle.

---

## SESSION 4: Mindray — Bedside AI at Scale

**Presenter:** Mindray Global Clinical Education Director

**Company Overview:**
- Founded 1991, Shenzhen
- **30+ years** in medical devices
- Present in **190+ countries**
- Products: patient monitoring, ultrasound, in-vitro diagnostics, surgical equipment

**AI-Powered Products Showcased:**
1. **BeneVision AI Monitor** — Real-time early warning system:
   - Sepsis early alert: 6 hours before clinical signs
   - Deterioration score updated every 5 minutes
   - ICU nurse-to-patient ratio reduced from 1:2 to 1:4 in pilot hospitals

2. **Resona I9 Ultra** — AI ultrasound:
   - Auto-measurement of cardiac function (EF, volumes) in real time
   - Non-expert operators achieve expert-level scan quality via AI guidance
   - Claimed 60% reduction in scan variability

3. **BC-6200 Auto Hematology** — AI-assisted blood cell classification:
   - Flags abnormal morphology automatically
   - Reduces manual microscopy review by 80%

**Scale Context:**
- In China: 97% of ICUs use Mindray monitors
- Globally: 1.5 million devices active in healthcare facilities

**Key Takeaway (Haitham):**
The sepsis early warning is the one that matters most for us. We lose patients to sepsis every year because the clinical signs are subtle and late. Six hours of advance warning is the difference between saving and losing that patient. If this AI can replicate that performance in our environment, it's worth a serious pilot in our ICUs.

---

## SESSION 5: Smart Hospital Tour — AI in Practice

**Host:** Wang Zhixun — Director, Planning and Management Centre, Department of Information and Intelligent Development, Zhongshan Hospital, Fudan University

**What We Saw (Walking Tour):**

### Outpatient Registration AI:
- Old system: 20 staff at registration counters
- New system: 1 staff + AI kiosk network
- **AI customer service robots** handle 80% of questions (scheduling, directions, wait times)
- Facial recognition for returning patients — zero check-in friction

### Master Agent (Hospital Brain):
- Centralized AI coordinator integrating: scheduling, beds, labs, pharmacy, imaging
- Real-time bed management: patient discharge predicted 4 hours in advance → housekeeping + bed allocation automated
- **Master Agent handles 20,000 patients/day** through the hospital with fewer staff than 5 years ago (smaller hospital footprint, same throughput)

### AI Pharmacy:
- Robotic dispensing for 95% of outpatient prescriptions
- Zero dispensing errors in last 18 months
- Average wait time: 3 minutes (from 25 minutes)

### AI Endoscopy Suite:
- Every colonoscopy procedure has AI second reader running in real-time
- Polyp detection on screen annotated in real time for the endoscopist
- Detection sensitivity: >95% (vs. 85–90% expert human rate alone)
- Miss rate for flat adenomas cut by 60%

### Imaging Reading Room:
- AI pre-reads every scan before radiologist sees it
- CT chest: AI flags findings, measures nodules, compares to priors
- MRI brain: AI identifies lesions, segments volumes
- Radiologist reviews, confirms, or overrides AI findings
- Net result: radiologist throughput increased 2.8× without adding staff

**Key Takeaway (Haitham):**
The shift from 20 registration staff to 1 was the visual punch. That's not efficiency — that's transformation. The AI doesn't replace the doctors, but it replaces every administrative and repetitive task around them. Our 650-branch organization has thousands of people doing exactly that kind of repetitive work. The same model applies here.

---

## SESSION 6: Liu Lei — Medical AI Research Infrastructure

**Presenter:** Liu Lei — Executive Vice-Dean, Institute of Intelligent Medicine, Fudan University

**Research Infrastructure:**
- **1,200 A100 GPUs** in dedicated medical AI compute cluster
- Connected to **19 hospitals** in the Fudan network
- **2,000+ active users** (researchers, clinicians, data scientists)
- IRB-approved data federation: hospitals share de-identified data for research

**Key Research Projects:**

### MedBERT (Chinese):
- BERT-based foundation model pre-trained on Chinese EMR text
- 400 million parameter model
- Training data: 50 million clinical notes, discharge summaries, radiology reports
- Tasks: diagnosis coding, clinical NLP, adverse event detection

### OHDSI Network (China Node):
- China's first OMOP CDM implementation at scale
- Standardizes data from 19 hospitals into single queryable format
- Enables multi-site studies without moving patient data
- Published 12 peer-reviewed studies in 2024 from the network

**Lessons for Other Health Systems:**
1. Data governance is the bottleneck, not compute
2. Clinical champions matter more than technical leads
3. Small models fine-tuned on local data often beat large general models
4. Regulatory pathway (NMPA) requires prospective validation, not just retrospective

**Key Takeaway (Haitham):**
1,200 A100 GPUs is ¥400 million+ of infrastructure. Most health systems can't replicate that. But the OHDSI/OMOP insight is valuable without needing GPUs — it's about structuring your existing data so it's research-ready. We should be doing this now. Every year we delay is another year of unstandardized data that can't be used.

---

## SESSION 7: Shi Yinghong — Big Data at Clinical Scale

**Presenter:** Shi Yinghong — Deputy Director, Zhongshan Hospital, Fudan University

**Dataset Overview:**
- **29 billion** patient encounter records
- **30 TB** of structured clinical text
- **3 PB** of medical imaging data
- Longitudinal coverage: 1990–present (35 years of data)

**GuanXin Platform (Cardiovascular AI):**
- **300 TB** cardiovascular-specific dataset
- Built with input from **50+ domain experts** (cardiologists, radiologists, epidemiologists)
- **3,000+ clinical decision pathways** encoded
- Applications: risk stratification, drug interaction screening, readmission prediction

**Research Outputs (2024):**
- 47 peer-reviewed publications from the platform
- 3 NMPA-approved AI diagnostic tools
- Deployed in 12 hospitals for live clinical use

**Public Health Surveillance:**
- Real-time disease surveillance across all 19 Fudan network hospitals
- COVID-19 early warning: detected surge 48 hours before official reports
- Influenza forecasting: 85% accuracy at 2-week horizon

**Key Takeaway (Haitham):**
29 billion records is a number I can't fully process. But the practical message is clear: the value of health data compounds over time. The hospitals that started digitizing in 1990 now have a 35-year longitudinal dataset that nobody can replicate. For us, every day we don't capture structured data is a day of compounding debt. The GuanXin cardiovascular platform shows what's possible — 50 experts and 3000 decision pathways took years, but the result is a tool that outperforms individual cardiologists on risk scoring.

---

## SESSION 8: Dr. John — United Imaging AI Research Division

**Presenter:** Dr. John, Head of AI Research, United Imaging Healthcare

**UAI Research Portal:**
- Open platform for academic collaboration on medical imaging AI
- 200+ research teams registered globally
- Pre-trained models available for CT, MRI, PET-CT segmentation

**Research Highlights:**

### AI Dose Reduction:
- Deep learning reconstruction allows 80% radiation dose reduction in CT
- Image quality equivalent to full-dose scan (SSIM >0.97)
- Clinical validation: 15 published studies across 8 countries

### Real-Time QC System:
- Embedded AI monitors image quality during acquisition (not post-hoc)
- Immediately alerts if scan needs to be repeated before patient leaves table
- Reduces rescans from 8% → 1.2% in pilot hospitals

### Regulatory Track Record:
- **15 FDA** clearances — all AI-embedded devices, not standalone
- **31 CE** marks — European market
- **44 NMPA** approvals — Chinese domestic market
- Combined 90 approvals makes UIH the most FDA/CE/NMPA-cleared Chinese medical device company

**Collaboration Model:**
- UIH provides hardware + raw data + compute
- Academic partners provide annotation, validation, publication
- Co-ownership of resulting algorithms
- 18-month average from data collection to regulatory submission

**Key Takeaway (Haitham):**
The dose reduction story is the clearest win: 80% less radiation for equivalent image quality. That's not incremental improvement — that's a safety revolution. Every CT scanner we procure from this point should have this capability. The 8% → 1.2% rescan rate is also significant: at our scale (650 branches doing thousands of scans daily), that's thousands of unnecessary repeat exposures eliminated per month.

---

## END OF DAY 1 – COMPLETE TRANSCRIPT

**Day 1 Summary — Haitham's Overall Reflection:**

The theme of Day 1 is: China is not experimenting with AI in healthcare. They are operating it at scale. Every institution we visited today has deployed AI not as a pilot but as standard of care. The numbers are production numbers — 20,000 patients/day through a single AI-managed hospital, 29 billion records, 6.2 million outpatients per year with AI-assisted diagnosis at every step.

For our healthcare organization, the relevant question is not "should we adopt AI?" — that's already decided globally. The question is: which of these systems translate to our environment? Sepsis AI (Mindray), dose reduction AI (UIH), and operational AI (master agent/smart hospital) all apply directly. The research infrastructure (GPUs, OHDSI) is a longer-term conversation.

Day 2 will cover specific AI endoscopy techniques and see a live demonstration at Zhongshan's endoscopy suite.
