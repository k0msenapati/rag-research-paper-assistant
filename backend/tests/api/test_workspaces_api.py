def test_workspace_crud_lifecycle(client):
    create_resp = client.post(
        "/api/v1/workspaces",
        json={"name": "Quantum Computing Lab", "description": "Research on QEC"},
    )
    assert create_resp.status_code == 201
    ws = create_resp.json()
    ws_id = ws["id"]
    assert ws["name"] == "Quantum Computing Lab"
    assert ws["document_count"] == 0

    list_resp = client.get("/api/v1/workspaces")
    assert list_resp.status_code == 200
    workspaces = list_resp.json()
    assert any(w["id"] == ws_id for w in workspaces)

    get_resp = client.get(f"/api/v1/workspaces/{ws_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Quantum Computing Lab"

    update_resp = client.put(
        f"/api/v1/workspaces/{ws_id}",
        json={"name": "Quantum Algorithms Lab"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Quantum Algorithms Lab"

    delete_resp = client.delete(f"/api/v1/workspaces/{ws_id}")
    assert delete_resp.status_code == 204

    get_after_delete = client.get(f"/api/v1/workspaces/{ws_id}")
    assert get_after_delete.status_code == 404
