def test_predict():
    from main import predict

    data = [0.1] * 100
    result = predict(data)

    assert result in ["NORMAL", "ABNORMAL"]