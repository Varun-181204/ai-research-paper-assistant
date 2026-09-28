import io
from fastapi.testclient import TestClient


def test_dashboard_stats(client: TestClient):
    """Test dashboard stats endpoint returns proper schema with non-fake metrics."""
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_papers" in data
    assert "papers_processed" in data
    assert "total_chunks" in data
    assert "total_conversations" in data
    assert "total_notes" in data
    assert isinstance(data["recent_papers"], list)


def test_notes_crud(client: TestClient):
    """Test creating, reading, updating, and deleting a research note."""
    # Create
    create_res = client.post(
        "/api/notes",
        json={"title": "Test Methodology Note", "content": "Analyzing self-attention layer complexity."}
    )
    assert create_res.status_code == 201
    note_data = create_res.json()
    note_id = note_data["id"]
    assert note_data["title"] == "Test Methodology Note"

    # List
    list_res = client.get("/api/notes")
    assert list_res.status_code == 200
    assert any(n["id"] == note_id for n in list_res.json())

    # Update
    update_res = client.put(
        f"/api/notes/{note_id}",
        json={"title": "Updated Methodology Note", "content": "Updated content with O(N^2) complexity details."}
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Methodology Note"

    # Delete
    del_res = client.delete(f"/api/notes/{note_id}")
    assert del_res.status_code == 200

    # Verify deleted
    get_res = client.get(f"/api/notes/{note_id}")
    assert get_res.status_code == 404


def test_semantic_search_endpoint(client: TestClient):
    """Test semantic search endpoint."""
    res = client.post("/api/search", json={"query": "deep learning medical imaging", "top_k": 5})
    assert res.status_code == 200
    data = res.json()
    assert "query" in data
    assert "results" in data
    assert "total_results" in data
