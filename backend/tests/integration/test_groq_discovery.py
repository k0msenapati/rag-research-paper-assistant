from app.core.groq_client import groq_service

def test_groq_dynamic_models_discovery():
    models = groq_service.get_available_models(refresh=True)
    assert isinstance(models, list)
    assert len(models) > 0
    assert not any("whisper" in m.lower() for m in models)
    assert not any("guard" in m.lower() for m in models)
