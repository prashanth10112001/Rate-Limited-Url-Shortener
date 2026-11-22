CHARACTERS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
BASE = len(CHARACTERS)


def encode( id : int ) -> str:

    if id<0:
        raise ValueError("Cannot Base62-encode a negative number")

    if id==0:
        return str(CHARACTERS[0])

    result : list[str] = []

    while id>0:
        id,rem = divmod(id,BASE)
        result.append(CHARACTERS[rem])

    code = "".join(reversed(result))

    return str(code)

def decode( code : str ) -> int:

    if not code:
        raise ValueError("Cannot Base62-decode an empty string")

    id = 0
    for ch in code:
        idx = CHARACTERS.index(ch)
        id = id * BASE + idx

    return int(id)

# for sample_id in [0, 1, 61, 62, 125, 100000]:
#     short_code = encode(sample_id)
#     decoded_id = int(decode(short_code))
#     assert decoded_id == sample_id, f"Mismatch for {sample_id}: got {decoded_id}"
#     print(f"id={sample_id} -> code={short_code!r} -> decoded={decoded_id}")