from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Test the root endpoint returns correct metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "AI Research Paper Assistant"
    assert data["health"] == "/api/health"
    assert "version" in data


def test_health_endpoint(client: TestClient):
    """Test the health check endpoint returns healthy status and DB details."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["app_name"] == "AI Research Paper Assistant"
    assert "database" in data
    assert "connected" in data["database"]
    assert "timestamp" in data


def test_direct_health_endpoint(client: TestClient):
    """Test the alias /health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
