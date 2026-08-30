import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock,patch

import pytest
from fastapi import HTTPException

from app.core.piston import PistonError
from app.models.adversarial_question import AdversarialQuestion
from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.candidate_test_results import CandidateTestResult
from app.models.coding_test_cases import CodingTestCase
from app.models.candidate_response import CorrectnessStatus
from app.models.user import User
from app.schema.candidate_response import CandidateResponseResponse
from app.services.assessment import (
    activate_assessment,
    add_question_to_assessment,
    create_assessment,
    create_candidate_assessment,
    execute_code_questions,
    execute_candidate_code,
    execute_reference_implementation,
    extract_piston_stdout,
    get_all_assessments,
    get_assessment_by_id,
    get_candidate_assessments,
    get_questions_for_candidate_assessment,
    remove_question_from_assessment,
    save_candidate_code_test_results,
    save_candidate_response,
    start_candidate_assessment,
    submit_candidate_assessment,
    update_assessment,
)
from app.schema.candidate_response import ResponseCreate
from app.models.question_bank import QuestionType


def _make_mock_db_for_all(assessments):
    mock_db = MagicMock()
    mock_db.query.return_value.all.return_value = assessments
    return mock_db


def _make_mock_db_for_by_id(assessment):
    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .options.return_value
        .filter.return_value
        .first.return_value
    ) = assessment
    return mock_db


def _mock_query_result(result):
    query = MagicMock()
    query.filter.return_value.first.return_value = result
    query.filter.return_value.all.return_value = result
    query.options.return_value.filter.return_value.first.return_value = result
    return query


def test_get_all_assessments_returns_list():
    mock_db = _make_mock_db_for_all([])
    result = get_all_assessments(mock_db)
    assert isinstance(result, list)


def test_get_all_assessments_returns_empty_list():
    mock_db = _make_mock_db_for_all([])
    result = get_all_assessments(mock_db)
    assert result == []


def test_get_all_assessments_items_have_required_fields():
    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.title = "Test Assessment"
    mock_a.description = "A description"
    mock_a.duration_mins = 60
    mock_a.created_at = datetime(2025, 1, 1)

    mock_db = _make_mock_db_for_all([mock_a])
    result = get_all_assessments(mock_db)

    assert len(result) == 1
    item = result[0]
    assert item.assessment_id == 1
    assert item.title == "Test Assessment"
    assert item.description == "A description"
    assert item.duration_mins == 60
    assert item.created_at == datetime(2025, 1, 1)


def _make_mock_db_chain(final_result):
    mock_db = MagicMock()
    chain = mock_db.query.return_value
    chain.filter.return_value = chain
    chain.offset.return_value = chain
    chain.limit.return_value = chain
    chain.all.return_value = final_result
    return mock_db, chain


def test_get_all_assessments_no_filters_applies_none():
    mock_db, chain = _make_mock_db_chain([MagicMock()])
    result = get_all_assessments(mock_db)
    chain.filter.assert_not_called()
    chain.offset.assert_not_called()
    chain.limit.assert_not_called()
    assert len(result) == 1


def test_get_all_assessments_applies_search_filter():
    mock_db, chain = _make_mock_db_chain([])
    get_all_assessments(mock_db, search="python")
    chain.filter.assert_called_once()


def test_get_all_assessments_applies_status_filter():
    mock_db, chain = _make_mock_db_chain([])
    get_all_assessments(mock_db, status="Draft")
    chain.filter.assert_called_once()


def test_get_all_assessments_applies_search_and_status_filters():
    mock_db, chain = _make_mock_db_chain([])
    get_all_assessments(mock_db, search="python", status="Draft")
    assert chain.filter.call_count == 2


def test_get_all_assessments_applies_limit_and_offset():
    mock_db, chain = _make_mock_db_chain([])
    get_all_assessments(mock_db, limit=10, offset=5)
    chain.offset.assert_called_once_with(5)
    chain.limit.assert_called_once_with(10)


def test_get_assessment_by_id_returns_none_when_not_found():
    mock_db = _make_mock_db_for_by_id(None)
    result = get_assessment_by_id(mock_db, 999)
    assert result is None


def test_get_assessment_by_id_returns_correct_assessment():
    mock_a = MagicMock()
    mock_a.assessment_id = 42
    mock_a.assessment_questions = []

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 42)

    assert result is not None
    assert result.assessment_id == 42


def test_get_assessment_by_id_includes_questions_list():
    mock_aq = MagicMock()
    mock_aq.display_order = 1

    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.assessment_questions = [mock_aq]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    assert hasattr(result, "assessment_questions")
    assert isinstance(result.assessment_questions, list)
    assert len(result.assessment_questions) == 1


def test_get_assessment_by_id_questions_ordered_by_display_order():
    aq1 = MagicMock()
    aq1.display_order = 3
    aq2 = MagicMock()
    aq2.display_order = 1
    aq3 = MagicMock()
    aq3.display_order = 2

    mock_a = MagicMock()
    mock_a.assessment_questions = [aq1, aq2, aq3]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    orders = [aq.display_order for aq in result.assessment_questions]
    assert orders == [1, 2, 3]


def test_get_assessment_by_id_null_display_order_sorts_last():
    aq_null = MagicMock()
    aq_null.display_order = None
    aq_first = MagicMock()
    aq_first.display_order = 1

    mock_a = MagicMock()
    mock_a.assessment_questions = [aq_null, aq_first]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    assert result.assessment_questions[0].display_order == 1
    assert result.assessment_questions[1].display_order is None


def test_get_assessment_by_id_each_question_has_required_fields():
    mock_qb = MagicMock()
    mock_qb.question_bank_id = 10
    mock_qb.title = "What is X?"
    mock_qb.content = "Explain X in detail."
    mock_qb.type.value = "TEXT"
    mock_qb.maximum_score = 5.0
    mock_qb.tags = ["python", "oop"]

    mock_aq = MagicMock()
    mock_aq.assessment_q_id = 7
    mock_aq.display_order = 1
    mock_aq.marks = 5.0
    mock_aq.question_bank = mock_qb

    mock_a = MagicMock()
    mock_a.assessment_questions = [mock_aq]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    aq = result.assessment_questions[0]
    assert aq.assessment_q_id == 7
    assert aq.display_order == 1
    assert aq.marks == 5.0
    assert aq.question_bank.question_bank_id == 10
    assert aq.question_bank.title == "What is X?"
    assert aq.question_bank.content == "Explain X in detail."
    assert aq.question_bank.type.value == "TEXT"
    assert aq.question_bank.maximum_score == 5.0
    assert aq.question_bank.tags == ["python", "oop"]


def test_save_candidate_response_grades_json_correct_answer():
    from app.models.candidate_response import CorrectnessStatus

    mock_db = MagicMock()
    mock_session = MagicMock()

    mock_qb = MagicMock()
    mock_qb.correct_answer = {"answer": "b"}
    mock_qb.maximum_score = 4.0
    mock_qb.type = QuestionType.MULTIPLE_CHOICE

    mock_aq = MagicMock()
    mock_aq.adversarial_question.source_question = mock_qb

    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result(None),
        _mock_query_result(mock_aq),
    ]

    response_in = ResponseCreate(
        assessment_question_id=11,
        candidate_answer="b",
    )

    result = save_candidate_response(mock_db, 9, response_in)

    assert result.candidate_answer == "b"
    assert result.score == pytest.approx(4.0)
    assert result.is_correct == CorrectnessStatus.CORRECT

def test_save_candidate_code_test_adds_rows():
    mock_db = MagicMock()
    save_candidate_code_test_results(
        mock_db,
        response_id=5,
        execution_results=[
            {"test_case_id": 1, "passed": True},
            {"test_case_id": 2, "passed": False},
        ],
    )
    assert mock_db.add.call_count == 2
    first_row = mock_db.add.call_args_list[0].args[0]
    second_row = mock_db.add.call_args_list[1].args[0]
    assert isinstance(first_row, CandidateTestResult)
    assert first_row.response_id == 5
    assert first_row.test_case_id == 1
    assert first_row.passed is True
    assert isinstance(second_row, CandidateTestResult)
    assert second_row.test_case_id == 2
    assert second_row.passed is False

def test_execute_code_questions_results(monkeypatch):
    mock_db = MagicMock()
    mock_qb = MagicMock()
    mock_qb.type = QuestionType.CODING
    mock_qb.question_bank_id = 10
    mock_qb.question_metadata = {
        "function_name": "calculate_total",
        "function_signature": "def calculate_total(price, quantity, discount)",
        "parameters": [
            {"name": "price", "type": "int"},
            {"name": "quantity", "type": "int"},
            {"name": "discount", "type": "int"},
        ],
    }
    test_case = CodingTestCase()
    test_case.test_case_id = 1
    test_case.input_data = "(1000, 2, 10)"
    test_case.expected_output = "1990"
    test_case.description = "case 1"
    test_case.is_hidden = False
    mock_piston_client = MagicMock()
    mock_piston_client.execute.return_value = {"run": {"stdout": "1990\n", "stderr": ""}}
    monkeypatch.setattr(
        "app.services.assessment.get_test_cases_by_question_id",
        lambda db, question_id: [test_case],
    )
    result = execute_code_questions(
        mock_db,
        mock_qb,
        candidate_code=(
            "def calculate_total(price, quantity, discount):\n"
            "    subtotal = price * quantity\n"
            "    total = subtotal - discount\n"
            "    return total\n"
        ),
        piston_client=mock_piston_client,
    )
    assert result["Test Cases"] == 1
    assert result["Passed"] == 1
    assert result["Failed"] == 0
    assert result["Results"][0]["test_case_id"] == 1
    assert result["Results"][0]["passed"] is True
    mock_piston_client.execute.assert_called_once()
    called_source = mock_piston_client.execute.call_args.kwargs["source_code"]
    assert "result = calculate_total(1000, 2, 10)" in called_source
    assert "print(result)" in called_source


def test_execute_code_questions_uses_function_signature_name_missing(monkeypatch):
    mock_db = MagicMock()
    mock_qb = MagicMock()
    mock_qb.type = QuestionType.CODING
    mock_qb.question_bank_id = 10
    mock_qb.question_metadata = {
        "function_signature": "def fibonacci(n)",
        "parameters": [{"name": "n", "type": "int"}],
    }
    test_case = CodingTestCase()
    test_case.test_case_id = 3
    test_case.input_data = "(7)"
    test_case.expected_output = "13"
    test_case.description = "case 3"
    test_case.is_hidden = False
    mock_piston_client = MagicMock()
    mock_piston_client.execute.return_value = {"run": {"stdout": "13\n", "stderr": ""}}
    monkeypatch.setattr(
        "app.services.assessment.get_test_cases_by_question_id",
        lambda db, question_id: [test_case],
    )
    execute_code_questions(
        mock_db,
        mock_qb,
        candidate_code=(
            "def fibonacci(n):\n"
            "    if n <= 1:\n"
            "        return n\n"
            "    return fibonacci(n - 1) + fibonacci(n - 2)\n"
        ),
        piston_client=mock_piston_client,
    )
    called_source = mock_piston_client.execute.call_args.kwargs["source_code"]
    assert "result = fibonacci(7)" in called_source


def test_execute_code_questions_rejects_parameter_mismatch(monkeypatch):
    mock_db = MagicMock()
    mock_qb = MagicMock()
    mock_qb.type = QuestionType.CODING
    mock_qb.question_bank_id = 10
    mock_qb.question_metadata = {
        "function_name": "calculate_total",
        "parameters": [{"name": "price"}, {"name": "quantity"}, {"name": "discount"}],
    }
    test_case = CodingTestCase()
    test_case.test_case_id = 4
    test_case.input_data = "(1000, 2)"
    test_case.expected_output = "0"
    test_case.description = "case 4"
    test_case.is_hidden = False

    monkeypatch.setattr(
        "app.services.assessment.get_test_cases_by_question_id",
        lambda db, question_id: [test_case],
    )

    with pytest.raises(HTTPException) as exc_info:
        execute_code_questions(
            mock_db,
            mock_qb,
            candidate_code="def calculate_total(price, quantity, discount):\n    return 0\n",
            piston_client=MagicMock(),
        )
    assert exc_info.value.status_code == 400


def test_execute_code_questions_with_piston_error(monkeypatch):
    mock_db = MagicMock()
    mock_qb = MagicMock()
    mock_qb.type = QuestionType.CODING
    mock_qb.question_bank_id = 10
    mock_qb.question_metadata = {"function_name": "calculate_total"}

    test_case = CodingTestCase()
    test_case.test_case_id = 1
    test_case.input_data = "1"
    test_case.expected_output = "1"
    test_case.description = "case 1"
    test_case.is_hidden = False

    mock_piston_client = MagicMock()
    mock_piston_client.execute.side_effect = PistonError("boom")
    monkeypatch.setattr(
        "app.services.assessment.get_test_cases_by_question_id",
        lambda db, question_id: [test_case],
    )
    result = execute_code_questions(
        mock_db,
        mock_qb,
        candidate_code=(
            "def calculate_total(price, quantity, discount):\n"
            "    return price * quantity - discount\n"
        ),
        piston_client=mock_piston_client,
    )
    assert result["Test Cases"] == 1
    assert result["Passed"] == 0
    assert result["Failed"] == 1
    assert result["Results"][0]["passed"] is False
    assert result["Results"][0]["error_message"] == "boom"


def test_execute_reference_implementation_returns_stdout():
    mock_piston_client = MagicMock()
    mock_piston_client.execute.return_value = {
        "run": {"stdout": "[0, 1]\n", "stderr": ""}
    }
    result = execute_reference_implementation(
        question_metadata={
            "function_name": "two_sum",
            "function_signature": "def two_sum(nums, target)",
        },
        implementation=(
            "def two_sum(nums, target):\n"
            "    seen = {}\n"
            "    for i, num in enumerate(nums):\n"
            "        complement = target - num\n"
            "        if complement in seen:\n"
            "            return sorted([seen[complement], i])\n"
            "        seen[num] = i\n"
        ),
        input_data="([2, 7, 11, 15], 9)",
        piston_client=mock_piston_client,
    )
    assert result["compiled"] is True
    assert result["stdout"] == "[0, 1]\n"
    assert result["stderr"] == ""
    assert result["error_message"] is None
    assert "result = two_sum([2, 7, 11, 15], 9)" in result["source_code"]
    mock_piston_client.execute.assert_called_once()


def test_execute_reference_implementation_returns_error_message():
    mock_piston_client = MagicMock()
    mock_piston_client.execute.return_value = {
        "run": {"stdout": "", "stderr": "NameError: two_sum is not defined\n"}
    }
    result = execute_reference_implementation(
        question_metadata={
            "function_name": "two_sum",
            "function_signature": "def two_sum(nums, target)",
        },
        implementation="def two_sum(nums, target):\n    return []\n",
        input_data="([2, 7, 11, 15], 9)",
        piston_client=mock_piston_client,
    )
    assert result["compiled"] is False
    assert result["stdout"] == ""
    assert result["stderr"] == "NameError: two_sum is not defined\n"
    assert result["error_message"] == "NameError: two_sum is not defined\n"

def test_execute_candidate_code_success_new_response(monkeypatch):
    mock_db = MagicMock()
    query_map = {
        CandidateAssessment: MagicMock(candidate_assess_id=1),
        AssessmentQuestion: MagicMock(
            assessment_q_id=2,
            adversarial_question=MagicMock(
                source_question=MagicMock(type=QuestionType.CODING)
            )
        ),
        CandidateResponseResponse: None
    }

    def mock_query(model):
        query_mock = MagicMock()
        query_mock.options.return_value = query_mock
        query_mock.filter.return_value = query_mock
        query_mock.first.return_value = query_map.get(model)
        return query_mock
    mock_db.query.side_effect = mock_query
    mock_execution_result = {
        "Test Cases": 5,
        "Passed": 4,
        "Failed": 1,
        "Results": [{"test": "case 1", "status": "passed"}]
    }
    monkeypatch.setattr(
        "app.services.assessment.execute_code_questions",
        lambda db, question_bank, candidate_code, language, version, piston_client: mock_execution_result,
    )
    mock_save_results = MagicMock()
    monkeypatch.setattr(
        "app.services.assessment.save_candidate_code_test_results",
        mock_save_results,
    )
    result = execute_candidate_code(
        db=mock_db,
        candidate_assessment_id=1,
        assessment_question_id=2,
        code="print('hello')",
        piston_client=MagicMock()
    )
    assert result == {
        "score": 80.0,
        "is_correct": False,
        "test_cases_passed": 4,
        "test_cases_failed": 1,
        "test_cases_total": 5,
        "results": mock_execution_result["Results"]
    }
    mock_db.add.assert_called_once()  
    mock_db.flush.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    mock_save_results.assert_called_once()

def test_execute_code_questions_rejects_non_coding_question():
    mock_db = MagicMock()
    mock_qb = MagicMock()
    mock_qb.type = QuestionType.MULTIPLE_CHOICE
    with pytest.raises(HTTPException) as exc_info:
        execute_code_questions(
            mock_db,
            mock_qb,
            candidate_code="print(1)",
        )
    assert exc_info.value.status_code == 405
    assert exc_info.value.detail == "Only coding questions are executed"


def test_extract_piston_stdout_reads_run_stdout():
    result = {"run": {"stdout": "hello\n"}}
    assert extract_piston_stdout(result) == "hello\n"


def test_extract_piston_stdout_reads_top_level_stdout():
    result = {"stdout": "hello\n"}
    assert extract_piston_stdout(result) == "hello\n"

def test_extract_piston_stdout_returns_empty_string_for_non_dict():
    assert extract_piston_stdout(None) == ""

def test_save_candidate_response_code_test_cases():
    mock_db = MagicMock()
    mock_session = MagicMock()
    mock_existing_response = MagicMock()
    mock_existing_response.response_id = 99
    mock_qb = MagicMock()
    mock_qb.maximum_score = 10.0
    mock_qb.type = QuestionType.CODING
    mock_aq = MagicMock()
    mock_aq.adversarial_question.source_question = mock_qb
    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result(mock_existing_response),
        _mock_query_result(mock_aq),
    ]
    result = save_candidate_response(
        mock_db,
        9,
        ResponseCreate(
            assessment_question_id=11,
            candidate_answer="print(1)",
        ),
    )
    assert result.score is None
    assert result.is_correct is None
    assert result.test_cases_total == 0
    assert result.test_cases_passed == 0
    assert result.test_cases_failed == 0
    assert mock_db.add.call_count == 0


def test_save_candidate_response_handles_zero_test_cases():
    mock_db = MagicMock()
    mock_session = MagicMock()
    mock_existing_response = MagicMock()
    mock_existing_response.response_id = 101
    mock_qb = MagicMock()
    mock_qb.maximum_score = 10.0
    mock_qb.type = QuestionType.CODING

    mock_aq = MagicMock()
    mock_aq.adversarial_question.source_question = mock_qb
    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result(mock_existing_response),
        _mock_query_result(mock_aq),
    ]
    result = save_candidate_response(
        mock_db,
        9,
        ResponseCreate(
            assessment_question_id=11,
            candidate_answer="print(1)",
        ),
    )
    assert result.score is None
    assert result.is_correct is None
    assert result.test_cases_total == 0
    assert result.test_cases_passed == 0
    assert result.test_cases_failed == 0

def _make_mock_db_for_invite(assessment_result, candidate_result, existing_result):
    mock_db = MagicMock()

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is Assessment:
            mock_q.filter.return_value.first.return_value = assessment_result
        elif model is User:
            mock_q.filter.return_value.first.return_value = candidate_result
        elif model is CandidateAssessment:
            mock_q.filter.return_value.first.return_value = existing_result
        return mock_q

    mock_db.query.side_effect = query_side_effect
    return mock_db


def test_create_candidate_assessment_raises_404_when_assessment_not_found():
    mock_db = _make_mock_db_for_invite(None, MagicMock(), None)
    with pytest.raises(HTTPException) as exc_info:
        create_candidate_assessment(mock_db, assessment_id=99, candidate_id=1)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment not found"


def test_create_candidate_assessment_raises_404_when_candidate_not_found():
    mock_db = _make_mock_db_for_invite(MagicMock(), None, None)
    with pytest.raises(HTTPException) as exc_info:
        create_candidate_assessment(mock_db, assessment_id=1, candidate_id=99)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Candidate not found"


# def test_create_candidate_assessment_raises_400_when_already_invited():
#     mock_db = _make_mock_db_for_invite(MagicMock(), MagicMock(), MagicMock())
#     with pytest.raises(HTTPException) as exc_info:
#         create_candidate_assessment(mock_db, assessment_id=1, candidate_id=1)
#     assert exc_info.value.status_code == 400
#     assert exc_info.value.detail == "Candidate has already been invited to this assessment"


def test_create_candidate_assessment_returns_session_with_correct_fields():
    mock_db = _make_mock_db_for_invite(MagicMock(), MagicMock(), None)

    def refresh_side_effect(obj):
        obj.candidate_assess_id = 5
        obj.assessment_id = 1
        obj.candidate_id = 2
        obj.status = SessionStatus.STARTED

    mock_db.refresh.side_effect = refresh_side_effect

    result = create_candidate_assessment(mock_db, assessment_id=1, candidate_id=2)

    assert result.candidate_assess_id == 5
    assert result.assessment_id == 1
    assert result.candidate_id == 2
    assert result.status == SessionStatus.STARTED
    assert result.candidate_score is None
    assert result.total_score is None
    assert result.start_time is None
    assert result.end_time is None


def test_create_candidate_assessment_access_token_is_valid_uuid():
    mock_db = _make_mock_db_for_invite(MagicMock(), MagicMock(), None)
    mock_db.refresh.side_effect = None

    result = create_candidate_assessment(mock_db, assessment_id=1, candidate_id=2)

    parsed = uuid.UUID(result.access_token)
    assert str(parsed) == result.access_token


def _make_mock_db_for_start(session_result, assessment_result=None):
    mock_db = MagicMock()

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is CandidateAssessment:
            mock_q.filter.return_value.first.return_value = session_result
        elif model is Assessment:
            mock_q.filter.return_value.first.return_value = assessment_result
        return mock_q

    mock_db.query.side_effect = query_side_effect
    return mock_db

def test_execute_candidate_code_assessment_not_found(monkeypatch):
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        execute_candidate_code(mock_db, 1, 2, "print('code')")
    assert exc_info.value.status_code == 404
    assert "Candidate assessment not found." in exc_info.value.detail


def test_start_candidate_assessment_raises_404_when_token_not_found():
    mock_db = _make_mock_db_for_start(None)
    with pytest.raises(HTTPException) as exc_info:
        start_candidate_assessment(mock_db, "nonexistent-token")
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Invalid access token"


def test_start_candidate_assessment_returns_exisiting_session():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.IN_PROGRESS
    mock_session.end_time = datetime.now(timezone.utc) + timedelta(minutes=15)
    mock_db = _make_mock_db_for_start(mock_session)
    
    result = start_candidate_assessment(mock_db, "some-token")
    assert result is mock_session

def test_start_candidate_assessment_raises_400_when_resuming_expired_session():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.IN_PROGRESS
    mock_session.start_time = datetime(2099, 12, 31, tzinfo=timezone.utc)
    mock_session.end_time = datetime.now(timezone.utc)
    mock_db = _make_mock_db_for_start(mock_session)
    with pytest.raises(HTTPException) as exc_info:
        start_candidate_assessment(mock_db, "some-token")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Assessment has already been started"

    
def test_start_candidate_assessment_raises_400_when_completed():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.COMPLETED
    mock_db = _make_mock_db_for_start(mock_session)
    with pytest.raises(HTTPException) as exc_info:
        start_candidate_assessment(mock_db, "some-token")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Assessment has already been completed"

def test_execute_candidate_code_updates_existing_response(monkeypatch):
    mock_db = MagicMock()
    mock_existing_response = MagicMock(response_id=99, candidate_answer="old code")
    query_map = {
        CandidateAssessment: MagicMock(candidate_assess_id=1),
        AssessmentQuestion: MagicMock(
            assessment_q_id=2,
            adversarial_question=MagicMock(
                source_question=MagicMock(type=QuestionType.CODING)
            )
        ),
        CandidateResponseResponse: mock_existing_response
    }

def test_start_candidate_assessment_raises_400_when_expired():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.EXPIRED
    mock_db = _make_mock_db_for_start(mock_session)
    with pytest.raises(HTTPException) as exc_info:
        start_candidate_assessment(mock_db, "some-token")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Assessment has expired"


def test_start_candidate_assessment_returns_in_progress_status():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = 1
    
    mock_assessment = MagicMock()
    mock_assessment.duration_mins = 60
    mock_session.assessment = mock_assessment

    mock_db = _make_mock_db_for_start(mock_session, mock_assessment)

    result = start_candidate_assessment(mock_db, "valid-token")
    assert result.status == SessionStatus.IN_PROGRESS


def test_start_candidate_assessment_sets_start_time():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = 1

    mock_assessment = MagicMock()
    mock_assessment.duration_mins = 60
    mock_session.assessment = mock_assessment

    mock_db = _make_mock_db_for_start(mock_session, mock_assessment)

    start_candidate_assessment(mock_db, "valid-token")
    assert isinstance(mock_session.start_time, datetime)


def test_start_candidate_assessment_end_time_is_start_plus_duration():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = 1

    mock_assessment = MagicMock()
    mock_assessment.duration_mins = 45
    mock_session.assessment = mock_assessment

    mock_db = _make_mock_db_for_start(mock_session, mock_assessment)

    start_candidate_assessment(mock_db, "valid-token")
    assert mock_session.end_time == mock_session.start_time + timedelta(minutes=45)


def test_start_candidate_assessment_end_time_greater_than_start_time():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = 1

    mock_assessment = MagicMock()
    mock_assessment.duration_mins = 30
    mock_session.assessment = mock_assessment

    mock_db = _make_mock_db_for_start(mock_session, mock_assessment)

    start_candidate_assessment(mock_db, "valid-token")
    assert mock_session.end_time > mock_session.start_time


def _make_mock_db_for_my_assessments(results):
    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .options.return_value
        .filter.return_value
        .all.return_value
    ) = results
    return mock_db


def test_get_candidate_assessments_returns_empty_list():
    mock_db = _make_mock_db_for_my_assessments([])
    result = get_candidate_assessments(mock_db, candidate_id=1)
    assert result == []


def test_get_candidate_assessments_returns_list_with_items():
    mock_session = MagicMock()
    mock_db = _make_mock_db_for_my_assessments([mock_session])
    result = get_candidate_assessments(mock_db, candidate_id=1)
    assert len(result) == 1
    assert result[0] is mock_session


def test_get_candidate_assessments_loads_assessment_relation():
    mock_assessment = MagicMock()
    mock_assessment.assessment_id = 42
    mock_session = MagicMock()
    mock_session.assessment = mock_assessment
    mock_db = _make_mock_db_for_my_assessments([mock_session])
    result = get_candidate_assessments(mock_db, candidate_id=1)
    assert result[0].assessment.assessment_id == 42


def test_get_candidate_assessments_returns_all_matching_sessions():
    session_a = MagicMock()
    session_b = MagicMock()
    mock_db = _make_mock_db_for_my_assessments([session_a, session_b])
    result = get_candidate_assessments(mock_db, candidate_id=3)
    assert len(result) == 2
    assert result[0] is session_a
    assert result[1] is session_b


def _make_mock_db_for_questions(session_result):
    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .options.return_value
        .filter.return_value
        .first.return_value
    ) = session_result
    return mock_db


def test_get_questions_raises_404_when_session_not_found():
    mock_db = _make_mock_db_for_questions(None)
    with pytest.raises(HTTPException) as exc_info:
        get_questions_for_candidate_assessment(
            mock_db, candidate_assess_id=99, user_id=1
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment session not found"


def test_get_questions_raises_403_when_user_id_does_not_match():
    mock_session = MagicMock()
    mock_session.candidate_id = 5
    mock_session.status = SessionStatus.IN_PROGRESS
    mock_db = _make_mock_db_for_questions(mock_session)
    with pytest.raises(HTTPException) as exc_info:
        get_questions_for_candidate_assessment(
            mock_db, candidate_assess_id=1, user_id=99
        )
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "You are not authorised to access this assessment"


def test_get_questions_raises_400_when_status_is_expired():
    mock_session = MagicMock()
    mock_session.candidate_id = 5
    mock_session.status = SessionStatus.EXPIRED
    mock_db = _make_mock_db_for_questions(mock_session)
    with pytest.raises(HTTPException) as exc_info:
        get_questions_for_candidate_assessment(
            mock_db, candidate_assess_id=1, user_id=5
        )
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "This assessment has expired"


def test_get_questions_returns_list_when_valid():
    mock_qb = MagicMock()
    mock_qb.question_bank_id = 10
    mock_qb.title = "What is X?"

    mock_aq = MagicMock()
    mock_aq.display_order = 1
    mock_aq.question_bank = mock_qb

    mock_assessment = MagicMock()
    mock_assessment.assessment_questions = [mock_aq]

    mock_session = MagicMock()
    mock_session.candidate_id = 5
    mock_session.status = SessionStatus.IN_PROGRESS
    mock_session.assessment = mock_assessment

    mock_db = _make_mock_db_for_questions(mock_session)
    result = get_questions_for_candidate_assessment(
        mock_db, candidate_assess_id=1, user_id=5
    )

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0].question_bank.question_bank_id == 10


def test_get_questions_ordered_by_display_order():
    aq1 = MagicMock()
    aq1.display_order = 3
    aq2 = MagicMock()
    aq2.display_order = 1
    aq3 = MagicMock()
    aq3.display_order = 2

    mock_assessment = MagicMock()
    mock_assessment.assessment_questions = [aq1, aq2, aq3]

    mock_session = MagicMock()
    mock_session.candidate_id = 5
    mock_session.status = SessionStatus.IN_PROGRESS
    mock_session.assessment = mock_assessment

    mock_db = _make_mock_db_for_questions(mock_session)
    result = get_questions_for_candidate_assessment(
        mock_db, candidate_assess_id=1, user_id=5
    )

    orders = [aq.display_order for aq in result]
    assert orders == [1, 2, 3]

def test_create_assessment_returns_object_with_correct_fields():
    mock_db = MagicMock()
    result = create_assessment(
        mock_db,
        title="New Assessment",
        description="A description",
        duration_mins=60,
        creator_id=5,
    )
    assert result.title == "New Assessment"
    assert result.description == "A description"
    assert result.duration_mins == 60
    assert result.creator_id == 5


def test_create_assessment_commits_and_refreshes():
    mock_db = MagicMock()
    create_assessment(
        mock_db,
        title="Test",
        description=None,
        duration_mins=30,
        creator_id=1,
    )
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()


def test_create_assessment_accepts_none_description():
    mock_db = MagicMock()
    result = create_assessment(
        mock_db,
        title="No Desc",
        description=None,
        duration_mins=15,
        creator_id=2,
    )
    assert result.description is None
    assert result.title == "No Desc"


def _make_mock_db_for_add_question(
    assessment_result, adv_question_result, existing_result
):
    mock_db = MagicMock()

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is Assessment:
            mock_q.filter.return_value.first.return_value = (
                assessment_result
            )
        elif model is AdversarialQuestion:
            mock_q.filter.return_value.first.return_value = (
                adv_question_result
            )
        elif model is AssessmentQuestion:
            mock_q.filter.return_value.first.return_value = (
                existing_result
            )
        return mock_q

    mock_db.query.side_effect = query_side_effect
    return mock_db


def test_add_question_to_assessment_raises_404_when_assessment_missing():
    mock_db = _make_mock_db_for_add_question(None, MagicMock(), None)
    with pytest.raises(HTTPException) as exc_info:
        add_question_to_assessment(mock_db, 1, 2)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment not found"


def test_add_question_to_assessment_raises_404_when_adv_missing():
    mock_db = _make_mock_db_for_add_question(MagicMock(), None, None)
    with pytest.raises(HTTPException) as exc_info:
        add_question_to_assessment(mock_db, 1, 2)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Adversarial question not found"


def test_add_question_to_assessment_raises_409_when_already_linked():
    mock_db = _make_mock_db_for_add_question(
        MagicMock(), MagicMock(), MagicMock()
    )
    with pytest.raises(HTTPException) as exc_info:
        add_question_to_assessment(mock_db, 1, 2)
    assert exc_info.value.status_code == 409


def test_add_question_to_assessment_creates_row_with_fields():
    mock_db = _make_mock_db_for_add_question(
        MagicMock(), MagicMock(), None
    )

    def refresh_side_effect(obj):
        obj.assessment_q_id = 7

    mock_db.refresh.side_effect = refresh_side_effect

    result = add_question_to_assessment(
        mock_db, 1, 2, display_order=3, marks=5.0
    )

    assert result.assessment_q_id == 7
    assert result.assessments_id == 1
    assert result.adv_question_id == 2
    assert result.display_order == 3
    assert result.marks == pytest.approx(5.0)
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


def _make_mock_db_for_remove_question(
    assessment_result, assessment_question_result
):
    mock_db = MagicMock()

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is Assessment:
            mock_q.filter.return_value.first.return_value = (
                assessment_result
            )
        elif model is AssessmentQuestion:
            mock_q.filter.return_value.first.return_value = (
                assessment_question_result
            )
        return mock_q

    mock_db.query.side_effect = query_side_effect
    return mock_db


def test_remove_question_from_assessment_raises_404_no_assessment():
    mock_db = _make_mock_db_for_remove_question(None, MagicMock())
    with pytest.raises(HTTPException) as exc_info:
        remove_question_from_assessment(mock_db, 1, 2)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment not found"


def test_remove_question_from_assessment_raises_404_no_row():
    mock_db = _make_mock_db_for_remove_question(MagicMock(), None)
    with pytest.raises(HTTPException) as exc_info:
        remove_question_from_assessment(mock_db, 1, 2)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == (
        "Question is not linked to this assessment"
    )


def test_remove_question_from_assessment_deletes_row():
    mock_aq = MagicMock()
    mock_db = _make_mock_db_for_remove_question(MagicMock(), mock_aq)
    remove_question_from_assessment(mock_db, 1, 2)
    mock_db.delete.assert_called_once_with(mock_aq)
    mock_db.commit.assert_called_once()


def _make_mock_db_for_assessment(assessment_result):
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = (
        assessment_result
    )
    return mock_db


def test_update_assessment_raises_404_when_not_found():
    mock_db = _make_mock_db_for_assessment(None)
    with pytest.raises(HTTPException) as exc_info:
        update_assessment(mock_db, 1, title="New title")
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment not found"


def test_update_assessment_updates_only_provided_fields():
    mock_a = MagicMock()
    mock_a.title = "Old title"
    mock_a.description = "Old description"
    mock_a.duration_mins = 30
    mock_db = _make_mock_db_for_assessment(mock_a)

    result = update_assessment(mock_db, 1, title="New title")

    assert result.title == "New title"
    assert result.description == "Old description"
    assert result.duration_mins == 30
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()


def test_update_assessment_updates_all_provided_fields():
    mock_a = MagicMock()
    mock_db = _make_mock_db_for_assessment(mock_a)

    result = update_assessment(
        mock_db,
        1,
        title="New title",
        description="New description",
        duration_mins=45,
    )

    assert result.title == "New title"
    assert result.description == "New description"
    assert result.duration_mins == 45


def test_update_assessment_no_fields_leaves_values_unchanged():
    mock_a = MagicMock()
    mock_a.title = "Old title"
    mock_a.description = "Old description"
    mock_a.duration_mins = 30
    mock_db = _make_mock_db_for_assessment(mock_a)

    result = update_assessment(mock_db, 1)

    assert result.title == "Old title"
    assert result.description == "Old description"
    assert result.duration_mins == 30


def test_activate_assessment_raises_404_when_not_found():
    mock_db = _make_mock_db_for_assessment(None)
    with pytest.raises(HTTPException) as exc_info:
        activate_assessment(mock_db, 1)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment not found"


def test_activate_assessment_raises_400_when_not_draft():
    mock_a = MagicMock()
    mock_a.status = "Active"
    mock_db = _make_mock_db_for_assessment(mock_a)
    with pytest.raises(HTTPException) as exc_info:
        activate_assessment(mock_db, 1)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == (
        "Only draft assessments can be activated"
    )


def test_activate_assessment_sets_status_to_active():
    mock_a = MagicMock()
    mock_a.status = "Draft"
    mock_db = _make_mock_db_for_assessment(mock_a)

    result = activate_assessment(mock_db, 1)

    assert result.status == "Active"
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()

def test_execute_candidate_code_non_coding_question(monkeypatch):
    mock_db = MagicMock()
    query_map = {
        CandidateAssessment: MagicMock(candidate_assess_id=1),
        AssessmentQuestion: MagicMock(
            assessment_q_id=2,
            adversarial_question=MagicMock(
                source_question=MagicMock(type=QuestionType.MULTIPLE_CHOICE)
            )
        )
    }
    with pytest.raises(HTTPException) as exc_info:
        execute_candidate_code(mock_db, 1, 2, "print('code')")
    assert exc_info.value.status_code == 400


def test_submit_candidate_assessment_fetches_response_metrics_for_attempt():
    mock_db = MagicMock()

    mock_resp_1 = MagicMock()
    mock_resp_1.response_id = 101
    mock_resp_1.score = 2.0
    mock_resp_2 = MagicMock()
    mock_resp_2.response_id = 102
    mock_resp_2.score = 1.0

    mock_session = MagicMock()
    mock_session.responses = [mock_resp_1, mock_resp_2]

    mock_aq = MagicMock()
    mock_aq.marks = 5.0
    mock_aq.question_bank = None
    mock_assessment = MagicMock()
    mock_assessment.assessment_questions = [mock_aq]
    mock_session.assessment = mock_assessment

    metrics_row = CandidateResponseMetrics(candidate_response_id=101)
    session_query = _mock_query_result(mock_session)
    metrics_query = _mock_query_result([metrics_row])
    mock_db.query.side_effect = [session_query, metrics_query]

    with patch(
        "app.services.assessment.get_gemini_client",
        return_value=MagicMock(),
    ):
        result = submit_candidate_assessment(mock_db, 9)

    assert result is mock_session
    assert mock_session.status == SessionStatus.COMPLETED
    assert mock_db.query.call_count == 2
    assert mock_db.query.call_args_list[1].args == (CandidateResponseMetrics,)

    expected_filter = CandidateResponseMetrics.candidate_response_id.in_(
        [101, 102]
    )
    actual_filter = metrics_query.filter.call_args.args[0]
    assert actual_filter.compare(expected_filter)

    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_session)


def test_submit_candidate_assessment_skips_metrics_query_when_no_responses():
    mock_db = MagicMock()

    mock_session = MagicMock()
    mock_session.responses = []
    mock_assessment = MagicMock()
    mock_assessment.assessment_questions = []
    mock_session.assessment = mock_assessment

    session_query = _mock_query_result(mock_session)
    mock_db.query.side_effect = [session_query]

    with patch(
        "app.services.assessment.get_gemini_client"
    ) as mock_get_client:
        result = submit_candidate_assessment(mock_db, 9)

    assert result is mock_session
    assert mock_session.status == SessionStatus.COMPLETED
    assert mock_db.query.call_count == 1
    mock_get_client.assert_not_called()
    assert mock_session.behavioral_summary is None


def test_submit_candidate_assessment_raises_404_when_missing():
    mock_db = MagicMock()
    mock_db.query.side_effect = [_mock_query_result(None)]

    with pytest.raises(HTTPException) as exc_info:
        submit_candidate_assessment(mock_db, 999)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Candidate assessment not found"


def _make_metrics_row(response_id, **overrides):
    fields = {
        "candidate_response_id": response_id,
        "candidate_assessment_id": 9,
        "active_time_ms": 120000,
        "unique_keys_count": 30,
        "chars_alnum": 200,
        "chars_special": 10,
        "backspace_count": 15,
        "copy_event_count": 0,
        "paste_event_count": 3,
        "paste_char_count": 450,
        "focus_loss_count": 4,
        "focus_loss_time_ms": 20000,
    }
    fields.update(overrides)
    return CandidateResponseMetrics(**fields)


def _make_submit_ready_session(response_id=101):
    mock_resp = MagicMock()
    mock_resp.response_id = response_id
    mock_resp.score = 2.0

    mock_session = MagicMock()
    mock_session.responses = [mock_resp]

    mock_assessment = MagicMock()
    mock_assessment.assessment_questions = []
    mock_session.assessment = mock_assessment
    return mock_session


def test_submit_candidate_assessment_generates_and_stores_behavioral_summary():
    mock_db = MagicMock()
    mock_session = _make_submit_ready_session(response_id=101)
    metrics_row = _make_metrics_row(101, paste_event_count=3)

    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result([metrics_row]),
    ]

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = MagicMock(
        text="  The candidate pasted heavily and typed steadily.  ",
    )

    with patch(
        "app.services.assessment.get_gemini_client",
        return_value=mock_client,
    ):
        result = submit_candidate_assessment(mock_db, 9)

    assert result.behavioral_summary == (
        "The candidate pasted heavily and typed steadily."
    )

    call_kwargs = mock_client.models.generate_content.call_args.kwargs
    assert call_kwargs["model"] == "gemini-3.1-flash-lite"
    assert call_kwargs["config"].temperature == 0.0
    assert "3 paste event(s)" in call_kwargs["contents"]
    assert "450 pasted character(s)" in call_kwargs["contents"]
    mock_db.commit.assert_called_once()


def test_submit_candidate_assessment_skips_gemini_when_no_metrics_flushed():
    mock_db = MagicMock()
    mock_session = _make_submit_ready_session(response_id=201)

    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result([]),
    ]

    with patch(
        "app.services.assessment.get_gemini_client"
    ) as mock_get_client:
        result = submit_candidate_assessment(mock_db, 9)

    mock_get_client.assert_not_called()
    assert result.behavioral_summary is None
    mock_db.commit.assert_called_once()


def test_submit_candidate_assessment_summary_null_on_gemini_failure():
    mock_db = MagicMock()
    mock_session = _make_submit_ready_session(response_id=301)
    metrics_row = _make_metrics_row(301)

    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result([metrics_row]),
    ]

    with patch(
        "app.services.assessment.get_gemini_client",
        side_effect=RuntimeError("Gemini is unreachable"),
    ):
        result = submit_candidate_assessment(mock_db, 9)

    assert result is mock_session
    assert mock_session.status == SessionStatus.COMPLETED
    assert result.behavioral_summary is None
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_session)
