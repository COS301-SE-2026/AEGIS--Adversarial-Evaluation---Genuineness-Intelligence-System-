from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException, status

from app.services.question import get_all_categories, delete_source_question

def _mock_da_db(results):
    mock_db = MagicMock()
    mock_db.query.return_value.all.return_value = results
    return mock_db

def test_all_categories_empty_list():
    mock_db = _mock_da_db([])
    result = get_all_categories(mock_db)
    assert result == []

def test_return_all_categories():
    category1 = MagicMock()
    category1.category_id = 1
    category1.category_name = "Algorithms"
    category1.created_at = "2024-01-15T10:30:00"

    category2 = MagicMock()
    category2.category_id = 2
    category2.category_name = "Data Structures"
    category2.created_at = "2024-01-15T10:30:00"

    mock_db = _mock_da_db([category1, category2])
    result = get_all_categories(mock_db)

    assert len(result) == 2
    assert result[0].category_name == "Algorithms"
    assert result[1].category_name == "Data Structures"

def test_required_fields():
    mock_category = MagicMock()
    mock_category.category_id = 1
    mock_category.category_name = "Web Development"
    mock_category.created_at = "2024-01-15T10:30:00"

    mock_db = _mock_da_db([mock_category])
    result = get_all_categories(mock_db)

    assert len(result) == 1
    category = result[0]
    assert hasattr(category, "category_id")
    assert hasattr(category, "category_name")
    assert hasattr(category, "created_at")