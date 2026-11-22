
import pytest

from app.utils.base62 import encode, decode, CHARACTERS, BASE


class TestBase62Encode:

    @pytest.mark.parametrize(
        "value, expected",
        [
            (0, "0"),
            (1, "1"),
            (9, "9"),
            (10, "a"),
            (35, "z"),
            (36, "A"),
            (61, "Z"),
            (62, "10"),
            (125, "21"),
            (100000, "q0U"),
        ]
    )
    def test_encode(self, value, expected):
        assert encode(value) == expected

    def test_encode_negative_number(self):
        with pytest.raises(ValueError, match="negative number"):
            encode(-1)


class TestBase62Decode:

    @pytest.mark.parametrize(
        "code, expected",
        [
            ("0", 0),
            ("1", 1),
            ("9", 9),
            ("a", 10),
            ("z", 35),
            ("A", 36),
            ("Z", 61),
            ("10", 62),
            ("21", 125),
            ("q0U", 100000),
        ]
    )
    def test_decode(self, code, expected):
        assert decode(code) == expected

    def test_decode_empty_string(self):
        with pytest.raises(ValueError, match="empty string"):
            decode("")

    @pytest.mark.parametrize(
        "code",
        [
            "abc@123",
            "abc-123",
            "abc_123",
            "hello world",
            "abc#123",
        ]
    )
    def test_decode_invalid_characters(self, code):
        with pytest.raises(ValueError):
            decode(code)


class TestBase62RoundTrip:

    @pytest.mark.parametrize(
        "value",
        [
            0,
            1,
            10,
            35,
            36,
            61,
            62,
            125,
            1000,
            100000,
            999999,
            123456789,
        ]
    )
    def test_encode_decode_round_trip(self, value):
        assert decode(encode(value)) == value

    def test_decode_encode_round_trip(self):
        codes = ["0", "1", "a", "Z", "10", "abc123", "q0U"]

        for code in codes:
            assert encode(decode(code)) == code
