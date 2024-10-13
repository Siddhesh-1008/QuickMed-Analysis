import React, { useState } from "react";
import {
  IconChevronRight,
  IconFileUpload,
  IconProgress,
} from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStateContext } from "../../context/index";
import ReactMarkdown from "react-markdown";
import FileUploadModal from "./components/file-upload-modal";
import RecordDetailsHeader from "./components/record-details-header";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = "ADD UR GEMINI API KEY";

/* FULL DETAILS ABOUT SINGLE RECORD  */
function SingleRecordDetails() {
  /*
  const { state } = useLocation() is extracting the state object from the route, allowing you to access information passed during navigation, like recordName, analysisResult, or any other data.
   */
  const { state } = useLocation();
  /* state CONTAINS ALL DETAILS ABOUT RECORD FROM ITS recordname,userId,kanabanRecords,createdby... */
  console.log(state);

  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(
    state.analysisResult || "",
  );
  const [filename, setFilename] = useState("");
  const [filetype, setFileType] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { updateRecord } = useStateContext();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  /* handle the file */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("Selected file:", file);
    setFileType(file.type);
    setFilename(file.name);
    setFile(file);
  };

  /* READ THE WHOLE FILE */
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /* 
  ONCE UPLOAD UPDATE THE STATES
   */
  const handleFileUpload = async () => {
    setUploading(true);
    setUploadSuccess(false);

    // USED FOR  GENERATING  CONTENT
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    try {
      // GET THE FILE
      const base64Data = await readFileAsBase64(file);

      //PROVIDE TH
      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: filetype,
          },
        },
      ];

      /* GENERATE CONTENT BASED ON THE FILE AND MAKE USE OF GENAI MODE FOR IT  */
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      /* BASCICALLY GIVE THE PROMPT TO GEN AI */
      //       //const prompt = `
      // You are an expert cancer and disease diagnosis analyst. Use your knowledge base to provide personalized recommended treatments based on the analysis of medical reports and blood test results.

      // ### Treatment Plan Overview

      // **Analysis Result**: [Include a summary of the blood test results and any relevant medical history.]

      // Based on the analysis of your results, here is a clear and detailed treatment plan tailored to your health needs:

      // 1. **Understanding Your Condition**:
      //    Your blood test results indicate [specific condition or concern]. This suggests that [explain the condition in simple terms and what it might mean for the patient]. Recognizing the implications of these results is crucial for determining the next steps in your care.

      // 2. **Recommended Actions**:
      //    - **Follow-Up Tests**: To gain a comprehensive understanding of your health, it is advisable to schedule additional tests such as [list any further necessary tests]. These tests will help confirm your diagnosis and guide treatment options.
      //    - **Lifestyle Changes**: Consider implementing lifestyle modifications that can support your health. This may include [suggest dietary changes, exercise routines, stress management techniques, etc.].

      // 3. **Urgent Short-Term Treatment Plan**:
      //    If you are diagnosed with [specific condition], the following medications are recommended on an urgent basis:

      //    - **For Cancer**:
      //      - **Chemotherapy**: [Specify medication name, e.g., Doxorubicin, Dosage: 60 mg/m² every 21 days] to target cancer cells.
      //      - **Pain Management**: [Specify medication name, e.g., Acetaminophen, Dosage: 500 mg every 6 hours as needed] to manage pain.

      //    - **For Other Conditions**:
      //      - **Diabetes**: Metformin 500 mg twice daily to help regulate blood sugar levels.
      //      - **High Cholesterol**: Atorvastatin 20 mg once daily to manage cholesterol levels.

      //    It’s crucial to follow your doctor’s instructions regarding when and how to take these medications.

      // // 4. **Specialist Referrals**:
      //    Based on your condition, you may benefit from consultations with specialists, such as:
      //    - **Oncologist**: For any cancer-related concerns and treatment options.
      //    - **Dietitian**: To help create a nutrition plan that complements your treatment and supports recovery.

      // ### Next Steps
      // To ensure you receive the best care possible, take the following actions:
      // - **Schedule an Appointment**: Contact your primary care physician to discuss these results and your treatment plan. They can facilitate any necessary referrals and additional testing.
      // - **Prepare for Your Visit**: Bring this summary and a list of questions regarding your diagnosis or treatment. This will help you maximize your appointment time.

      // ### Conclusion
      // Your health is paramount, and seeking professional guidance is crucial. This treatment plan is designed to empower you with the knowledge and resources necessary for your health journey. Always remember that your healthcare provider is your best resource for personalized medical advice, so do not hesitate to reach out to them for support.

      const prompt = `
     You are an expert medical report analyzer. Your task is to summarize the content of the provided medical report clearly and concisely. Focus on the key findings and implications of the report. Additionally, evaluate whether the report indicates any potential health dangers or concerns that the patient should be aware of. Include details about any cells or indicators that are lower than normal in the analysis.

      Summary Structure:
      Overview: Provide a brief summary of the main findings in the report.
      Key Indicators: Highlight any abnormal results or significant factors, including those that are low or below normal levels.
      Potential Dangers: Assess if there are any immediate health risks or conditions that require urgent attention.
      Recommendations: Suggest any necessary follow-up actions or consultations with healthcare professionals.
      Emergency Medications: Recommend appropriate medications that could help manage identified conditions temporarily until the patient can see a healthcare provider.
      Instructions:
      Use clear and simple language to ensure the summary is easily understandable.
      Emphasize any critical information that the patient should know.
      Include specific emergency medications relevant to the findings (e.g., statins for high cholesterol, aspirin for cardiovascular risk, or glucose-lowering medications for borderline diabetes).
      Identify any low or deficient cells or indicators in the report (e.g., low hemoglobin, low white blood cell count) that may require further investigation.
      As well as provide medicines based on medical report
`;
      /*
      BASICALLY IT GENERATE TEXT BASED ON THE PROMPT
      BASICALLY IT TELLS WHAT SYMPTONS AND DANGER PRESENT IN THE REPORT
      */
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      setAnalysisResult(text);
      const updatedRecord = await updateRecord({
        documentID: state.id,
        analysisResult: text,
        kanbanRecords: "",
      });
      /* update the states menas once generate textg just closed down the modal that is browse file option  */
      setUploadSuccess(true);
      setIsModalOpen(false); // Close the modal after a successful upload
      setFilename("");
      setFile(null);
      setFileType("");
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  /* 
  GENERATE TREATMENT PLAN BASED ON UR ANALYSIS RESULT
   */
  // const processTreatmentPlan = async () => {
  //   setIsProcessing(true);

  //   const genAI = new GoogleGenerativeAI(geminiApiKey);

  //   const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  //   const prompt = `Your role and goal is to be an that will be using this treatment plan ${analysisResult} to create Columns:
  //   - Todo: Tasks that need to be started
  //   - Doing: Tasks that are in progress
  //   - Done: Tasks that are completed

  //   Each task should include a brief description. The tasks should be categorized appropriately based on the stage of the treatment process.

  //   Please provide the results in the following  format for easy front-end display no quotating or what so ever just pure the structure below:

  //   {
  //     "columns": [
  //       { "id": "todo", "title": "Todo" },
  //       { "id": "doing", "title": "Work in progress" },
  //       { "id": "done", "title": "Done" }
  //     ],
  //     "tasks": [
  //       { "id": "1", "columnId": "todo", "content": "Example task 1" },
  //       { "id": "2", "columnId": "todo", "content": "Example task 2" },
  //       { "id": "3", "columnId": "doing", "content": "Example task 3" },
  //       { "id": "4", "columnId": "doing", "content": "Example task 4" },
  //       { "id": "5", "columnId": "done", "content": "Example task 5" }
  //     ]
  // } `;

  //   const result = await model.generateContent(prompt);
  //   const response = await result.response;
  //   const text = response.text();
  //   // basically we are converting json stringify object to normal object
  //   const parsedResponse = JSON.parse(text);

  //   console.log(text);
  //   console.log(parsedResponse);
  //   const updatedRecord = await updateRecord({
  //     documentID: state.id,
  //     kanbanRecords: text,
  //   });
  //   console.log(updatedRecord);
  //   navigate("/screening-schedules", { state: parsedResponse });
  //   setIsProcessing(false);
  // };

  //   const processTreatmentPlan = async () => {
  //     setIsProcessing(true);

  //     const genAI = new GoogleGenerativeAI(geminiApiKey);
  //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  //     const recordID = state.id; // Assuming state.id uniquely identifies the record

  //     // Check if a treatment plan already exists in local storage
  //     const existingPlan = localStorage.getItem(`treatmentPlan_${recordID}`);

  //     if (existingPlan) {
  //         // If it exists, parse it and navigate to the treatment plan
  //         const parsedPlan = JSON.parse(existingPlan);
  //         console.log("Retrieved existing treatment plan:", parsedPlan);
  //         navigate("/screening-schedules", { state: parsedPlan });
  //         setIsProcessing(false);
  //         return; // Exit the function if an existing plan is found
  //     }

  //     // If it doesn't exist, create a new treatment plan
  //     const prompt = `Your role and goal is to be an expert that will be using this treatment plan ${analysisResult} to create Columns:
  //     - Todo: Tasks that need to be started
  //     - Doing: Tasks that are in progress
  //     - Done: Tasks that are completed

  //     Each task should include a brief description. The tasks should be categorized appropriately based on the stage of the treatment process.

  //     Please provide the results in the following format for easy front-end display:

  //     {
  //       "columns": [
  //         { "id": "todo", "title": "Todo" },
  //         { "id": "doing", "title": "Work in progress" },
  //         { "id": "done", "title": "Done" }
  //       ],
  //       "tasks": [
  //         { "id": "1", "columnId": "todo", "content": "Example task 1" },
  //         { "id": "2", "columnId": "todo", "content": "Example task 2" },
  //         { "id": "3", "columnId": "doing", "content": "Example task 3" },
  //         { "id": "4", "columnId": "doing", "content": "Example task 4" },
  //         { "id": "5", "columnId": "done", "content": "Example task 5" }
  //       ]
  //   } `;

  //     try {
  //         const result = await model.generateContent(prompt);
  //         const response = await result.response;

  //         // Extract and clean the text
  //         const text = response.text();

  //         // Clean the text to ensure it's valid JSON
  //         const cleanedText = text.replace(/```json|```/g, "").trim(); // Remove any markdown-like formatting

  //         // Parse the cleaned text
  //         const parsedResponse = JSON.parse(cleanedText);

  //         // Save the newly created treatment plan in local storage
  //         localStorage.setItem(`treatmentPlan_${recordID}`, JSON.stringify(parsedResponse));
  //         console.log("New treatment plan created:", parsedResponse);

  //         // Update the record with the new treatment plan
  //         await updateRecord({
  //             documentID: recordID,
  //             kanbanRecords: cleanedText,
  //         });

  //         navigate("/screening-schedules", { state: parsedResponse });
  //     } catch (error) {
  //         console.error("Error generating treatment plan:", error);
  //     } finally {
  //         setIsProcessing(false);
  //     }
  // };

  // const processTreatmentPlan = async () => {
  //   setIsProcessing(true);

  //   const genAI = new GoogleGenerativeAI(geminiApiKey);
  //   const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  //   const recordID = state.id; // Assuming state.id uniquely identifies the record

  //   // Check if a treatment plan already exists in local storage
  //   const existingPlan = localStorage.getItem(`treatmentPlan_${recordID}`);

  //   if (existingPlan) {
  //       // If it exists, parse it and navigate to the treatment plan
  //       const parsedPlan = JSON.parse(existingPlan);
  //       console.log("Retrieved existing treatment plan:", parsedPlan);
  //       navigate("/screening-schedules", { state: parsedPlan });
  //       setIsProcessing(false);
  //       return; // Exit the function if an existing plan is found
  //   }

  //   // If it doesn't exist, create a new treatment plan
  //   const prompt = `Your role and goal is to be an expert that will be using this treatment plan ${analysisResult} to create Columns:
  //   - Todo: Tasks that need to be started
  //   - Doing: Tasks that are in progress
  //   - Done: Tasks that are completed

  //   Each task should include a brief description. The tasks should be categorized appropriately based on the stage of the treatment process.

  //   Please provide the results in the following format for easy front-end display:

  //   {
  //     "columns": [
  //       { "id": "todo", "title": "Todo" },
  //       { "id": "doing", "title": "Work in progress" },
  //       { "id": "done", "title": "Done" }
  //     ],
  //     "tasks": [
  //       { "id": "1", "columnId": "todo", "content": "Example task 1" },
  //       { "id": "2", "columnId": "todo", "content": "Example task 2" },
  //       { "id": "3", "columnId": "doing", "content": "Example task 3" },
  //       { "id": "4", "columnId": "doing", "content": "Example task 4" },
  //       { "id": "5", "columnId": "done", "content": "Example task 5" }
  //     ]
  //   }`;

  //   try {
  //       const result = await model.generateContent(prompt);
  //       const response = await result.response;

  //       // Extract and clean the text
  //       const text = response.text();

  //       // Clean the text to ensure it's valid JSON
  //       const cleanedText = text.replace(/```json|```/g, "").trim(); // Remove any markdown-like formatting

  //       // Parse the cleaned text
  //       const parsedResponse = JSON.parse(cleanedText);

  //       // Save the newly created treatment plan in local storage
  //       localStorage.setItem(`treatmentPlan_${recordID}`, JSON.stringify(parsedResponse));
  //       console.log("New treatment plan created:", parsedResponse);

  //       // Update the record with the new treatment plan
  //       await updateRecord({
  //           documentID: recordID,
  //           kanbanRecords: cleanedText, // Ensure this reflects the new plan if necessary
  //       });

  //       // Navigate to the treatment plan screen with the new state
  //       navigate("/screening-schedules", { state: parsedResponse });
  //   } catch (error) {
  //       console.error("Error generating treatment plan:", error);
  //   } finally {
  //       setIsProcessing(false);
  //   }
  // };

  const processTreatmentPlan = async () => {
    setIsProcessing(true);

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Your role and goal is to be an AI that will be using this treatment plan ${analysisResult} to create Columns:
    - Todo: Tasks that need to be started
    - Doing: Tasks that are in progress
    - Done: Tasks that are completed

    Each task should include a brief description. The tasks should be categorized appropriately based on the stage of the treatment process.

    Please provide the results in the following format for easy front-end display with no quotations or any other symbols, just pure JSON:

    {
      "columns": [
        { "id": "todo", "title": "Todo" },
        { "id": "doing", "title": "Work in progress" },
        { "id": "done", "title": "Done" }
      ],
      "tasks": [
        { "id": "1", "columnId": "todo", "content": "Example task 1" },
        { "id": "2", "columnId": "todo", "content": "Example task 2" },
        { "id": "3", "columnId": "doing", "content": "Example task 3" },
        { "id": "4", "columnId": "doing", "content": "Example task 4" },
        { "id": "5", "columnId": "done", "content": "Example task 5" }
      ]
    }`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      // Store the JSON response in localStorage
      localStorage.setItem("treatmentPlan", text);

      // Parse the response for navigation or other usage
      const parsedResponse = JSON.parse(text);
      console.log(parsedResponse);

      // Update the record in your database with the treatment plan
      const updatedRecord = await updateRecord({
        documentID: state.id,
        kanbanRecords: text,
      });
      console.log(updatedRecord);

      // Navigate with the parsed response
      navigate("/screening-schedules", { state: parsedResponse });
    } catch (error) {
      console.error("Error processing treatment plan:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-[26px]">
      {/* THIS BUTTON SHOWS UPLOAD REPORT WHENEVER CLICKED IT WILL TELL U TO UPLOAD REPORTS */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="mt-6 inline-flex items-center gap-x-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-[#13131a] dark:text-white dark:hover:bg-neutral-800"
      >
        <IconFileUpload />
        Upload Reports
      </button>

      <FileUploadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onFileChange={handleFileChange}
        onFileUpload={handleFileUpload}
        uploading={uploading}
        uploadSuccess={uploadSuccess}
        filename={filename}
      />

      {/*
       state.recordName BASSICALLY CONTAINS RECORD NAME SUCH AS test,nn WHAT EVER RECORD NAME  THAT USER HAS GIVEN AND WE CAN SEE IT IN BROWSER SEARCH PAGE
        */}
      <RecordDetailsHeader recordName={state.recordName} />

      {/* BASICALLY IT CONTAINS ALL THE CONTENT GENRATED BY GOOGLE GEMINI */}
      <div className="w-full">
        <div className="flex flex-col">
          <div className="-m-1.5 overflow-x-auto">
            <div className="inline-block min-w-full p-1.5 align-middle">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-[#13131a]">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-neutral-700">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-200">
                    Personalized AI-Driven Treatment Plan
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-neutral-400">
                    A tailored medical strategy leveraging advanced AI insights.
                  </p>
                </div>

                {/* 
                SUMMARY ABOUT UR REPORT THAT HAS BEEN UPLOADED MENAS ANALYSIS RESULTS THAT IS GENERATED USING GEMINI */}
                <div className="flex w-full flex-col px-6 py-4 text-black">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Analysis Result
                    </h2>
                    <div className="space-y-2">
                      <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    </div>
                  </div>

                  {/* 
                  IconProgress IS A RENDER SPINNER ONLY WHEN processing IS TRUE
                  BASCIALLY WHEN U CKICKD ON TREATMENT PLAN
                   */}
                  <div className="mt-5 grid gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={processTreatmentPlan}
                      className="inline-flex items-center gap-x-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
                    >
                      View Treatment plan
                      <IconChevronRight size={20} />
                      {processing && (
                        <IconProgress
                          size={10}
                          className="mr-3 h-5 w-5 animate-spin"
                        />
                      )}
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 border-t border-gray-200 px-6 py-4 md:flex md:items-center md:justify-between dark:border-neutral-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-neutral-400">
                      <span className="font-semibold text-gray-800 dark:text-neutral-200"></span>{" "}
                    </p>
                  </div>
                  <div>
                    <div className="inline-flex gap-x-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SingleRecordDetails;
