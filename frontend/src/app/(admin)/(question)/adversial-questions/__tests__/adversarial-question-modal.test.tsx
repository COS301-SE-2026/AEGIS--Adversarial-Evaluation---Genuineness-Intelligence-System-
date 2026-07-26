import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdversarialQuestionModal from "../adversarial-question-modal";
import { apiGet, apiPatch, apiPost } from "../../../../../lib/apiClient";

jest.mock("../../../../../lib/apiClient", () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
}));

jest.mock("../../../../../lib/auth", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer test-token" }),
}));

const mockedApiGet = apiGet as jest.Mock;
const mockedApiPost = apiPost as jest.Mock;
const mockedApiPatch = apiPatch as jest.Mock;

const questions = [
  {
    question_bank_id: 1,
    title: "Reverse a linked list",
    content: "Write a function that reverses a singly linked list.",
    category_id: 1,
    difficulty: "Medium",
    type: "CODING",
    maximum_score: 10,
    tags: [],
  },
];

const categories = [{ category_id: 1, category_name: "Data Structures" }];

const strategies = [
  {
    strategy_id: 5,
    strategy_name: "Off-by-one trap",
    description: null,
    trap_mechanism_summary: null,
  },
];

const generatedQuestion = {
  adv_question_id: 42,
  source_question_id: 1,
  content: "Adversarial version of the question.",
  strategy_id: 5,
  llm: "gemini-3.1-flash-lite",
  generated_at: "2026-01-01T00:00:00Z",
};

const savedQuestion = {
  ...generatedQuestion,
  correct_answer: "reversed list",
  predicted_wrong_answer: "original list",
  trap_mechanism: "off-by-one",
  pattern_used: "off-by-one",
  validation_status: "validated",
};

const validateResponse = {
  adv_question_id: 42,
  weaponised_question: "Adversarial version of the question.",
  correct_answer: "The linked list is reversed in place, in O(n) time.",
  predicted_wrong_answer: "The linked list is copied and reversed.",
  gemini_response: "Gemini's real response text to the adversarial question.",
  gemini_took_bait: false,
  question_type: "CODING",
  test_case_results: null,
  piston_note: "Piston not configured — code execution skipped",
};

const regeneratedQuestion = {
  adv_question_id: 42,
  source_question_id: 1,
  content: "Second, regenerated adversarial version of the question.",
  strategy_id: 5,
  llm: "gemini-3.1-flash-lite",
  generated_at: "2026-01-02T00:00:00Z",
};

async function reachGeneratedState(onClose = jest.fn(), onSubmit = jest.fn()) {
  const user = userEvent.setup();

  render(
    <AdversarialQuestionModal
      isOpen
      mode="create"
      question_id={null}
      questions={questions}
      categories={categories}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );

  await waitFor(() => expect(mockedApiGet).toHaveBeenCalled());

  const [sourceSelect, strategySelect] = screen.getAllByRole("combobox");
  await user.selectOptions(sourceSelect, "1");
  await user.selectOptions(strategySelect, "5");

  mockedApiPost.mockResolvedValueOnce(generatedQuestion);
  await user.click(
    screen.getByRole("button", { name: /generate adversarial question/i })
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /^validate$/i })).not.toBeDisabled()
  );

  return user;
}

async function reachDeployableState(onClose = jest.fn(), onSubmit = jest.fn()) {
  const user = await reachGeneratedState(onClose, onSubmit);

  mockedApiPost.mockResolvedValueOnce(validateResponse);
  await user.click(screen.getByRole("button", { name: /^validate$/i }));
  await waitFor(
    () =>
      expect(screen.getByRole("button", { name: /deploy question/i })).not.toBeDisabled(),
    { timeout: 2000 }
  );

  return user;
}

describe("AdversarialQuestionModal — Deploy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiGet.mockResolvedValue(strategies);
  });

  it("calls POST /adversarial-questions/{adv_question_id}/save with no body when Deploy is clicked", async () => {
    const user = await reachDeployableState();

    mockedApiPost.mockResolvedValueOnce(savedQuestion);
    await user.click(screen.getByRole("button", { name: /deploy question/i }));

    await waitFor(() =>
      expect(mockedApiPost).toHaveBeenCalledWith(
        "/api/v1/adversarial-questions/42/save",
        undefined,
        { headers: { Authorization: "Bearer test-token" } }
      )
    );
  });

  it("closes the modal once the save call succeeds", async () => {
    const onClose = jest.fn();
    const user = await reachDeployableState(onClose);

    mockedApiPost.mockResolvedValueOnce(savedQuestion);
    await user.click(screen.getByRole("button", { name: /deploy question/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("shows an error and does not close the modal when the save call fails", async () => {
    const onClose = jest.fn();
    const user = await reachDeployableState(onClose);

    mockedApiPost.mockRejectedValueOnce(
      new Error("Adversarial question is already validated")
    );
    await user.click(screen.getByRole("button", { name: /deploy question/i }));

    expect(
      await screen.findByText("Adversarial question is already validated")
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /deploy question/i })).not.toBeDisabled()
    );
  });

  it("never calls POST /questions/source from the Deploy flow", async () => {
    const user = await reachDeployableState();

    mockedApiPost.mockResolvedValueOnce(savedQuestion);
    await user.click(screen.getByRole("button", { name: /deploy question/i }));

    await waitFor(() => expect(mockedApiPost).toHaveBeenCalled());
    expect(mockedApiPost).not.toHaveBeenCalledWith(
      "/api/v1/questions/source",
      expect.anything(),
      expect.anything()
    );
  });
});

describe("AdversarialQuestionModal — Validate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiGet.mockResolvedValue(strategies);
  });

  it("calls POST /adversarial-questions/{adv_question_id}/validate with no body when Validate is clicked", async () => {
    const user = await reachGeneratedState();

    mockedApiPost.mockResolvedValueOnce(validateResponse);
    await user.click(screen.getByRole("button", { name: /^validate$/i }));

    await waitFor(() =>
      expect(mockedApiPost).toHaveBeenCalledWith(
        "/api/v1/adversarial-questions/42/validate",
        undefined,
        { headers: { Authorization: "Bearer test-token" } }
      )
    );
  });

  it("renders the real correct_answer and gemini_response in the comparison panels, not placeholder text", async () => {
    const user = await reachGeneratedState();

    mockedApiPost.mockResolvedValueOnce(validateResponse);
    await user.click(screen.getByRole("button", { name: /^validate$/i }));

    expect(await screen.findByText(validateResponse.correct_answer)).toBeInTheDocument();
    expect(await screen.findByText(validateResponse.gemini_response)).toBeInTheDocument();
    expect(screen.queryByText(/placeholder answer/i)).not.toBeInTheDocument();
  });

  it("shows an inline error and does not populate the comparison when validate fails", async () => {
    const user = await reachGeneratedState();

    mockedApiPost.mockRejectedValueOnce(
      new Error("Only draft questions can be validated")
    );
    await user.click(screen.getByRole("button", { name: /^validate$/i }));

    expect(
      await screen.findByText("Only draft questions can be validated")
    ).toBeInTheDocument();
    expect(screen.queryByText(validateResponse.correct_answer)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deploy question/i })).toBeDisabled();
  });
});

describe("AdversarialQuestionModal — Regenerate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiGet.mockResolvedValue(strategies);
  });

  it("calls PATCH /adversarial-questions/{adv_question_id}/regenerate with the strategy_id, not a new POST to generate-adversarial", async () => {
    const user = await reachGeneratedState();
    mockedApiPost.mockClear();

    mockedApiPatch.mockResolvedValueOnce(regeneratedQuestion);
    await user.click(screen.getByRole("button", { name: /^regenerate$/i }));

    await waitFor(() =>
      expect(mockedApiPatch).toHaveBeenCalledWith(
        "/api/v1/adversarial-questions/42/regenerate",
        { strategy_id: 5 },
        { headers: { Authorization: "Bearer test-token" } }
      )
    );
    expect(mockedApiPost).not.toHaveBeenCalled();
  });

  it("updates the displayed content while the next Validate call still targets the same adv_question_id", async () => {
    const user = await reachGeneratedState();

    mockedApiPatch.mockResolvedValueOnce(regeneratedQuestion);
    await user.click(screen.getByRole("button", { name: /^regenerate$/i }));

    expect(await screen.findByText(regeneratedQuestion.content)).toBeInTheDocument();
    expect(screen.queryByText(generatedQuestion.content)).not.toBeInTheDocument();

    mockedApiPost.mockResolvedValueOnce(validateResponse);
    await user.click(screen.getByRole("button", { name: /^validate$/i }));

    await waitFor(() =>
      expect(mockedApiPost).toHaveBeenCalledWith(
        "/api/v1/adversarial-questions/42/validate",
        undefined,
        { headers: { Authorization: "Bearer test-token" } }
      )
    );
  });

  it("clears validationResult after a successful regenerate", async () => {
    const user = await reachDeployableState();

    expect(screen.getByText(validateResponse.correct_answer)).toBeInTheDocument();

    mockedApiPatch.mockResolvedValueOnce(regeneratedQuestion);
    await user.click(screen.getByRole("button", { name: /^regenerate$/i }));

    await waitFor(() =>
      expect(screen.queryByText(validateResponse.correct_answer)).not.toBeInTheDocument()
    );
    expect(screen.queryByText(validateResponse.gemini_response)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deploy question/i })).toBeDisabled();
  });

  it("shows an inline error and keeps the current content when regenerate fails", async () => {
    const user = await reachGeneratedState();

    mockedApiPatch.mockRejectedValueOnce(
      new Error("Only draft questions can be regenerated")
    );
    await user.click(screen.getByRole("button", { name: /^regenerate$/i }));

    expect(
      await screen.findByText("Only draft questions can be regenerated")
    ).toBeInTheDocument();
    expect(screen.getByText(generatedQuestion.content)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^regenerate$/i })).not.toBeDisabled()
    );
  });
});
