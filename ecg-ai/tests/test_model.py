def test_model_load():
    from main import load_model
    model = load_model()
    assert model is not None