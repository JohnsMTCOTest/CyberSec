from generators.flag_gen import derive_flag
from generators.binary_mutator import mutate_binary, CHUNK_MARKER
from generators.template_expander import generate_parameters, render_artifacts


def test_flag_generator_deterministic():
    flag1 = derive_flag('abc')
    flag2 = derive_flag('abc')
    flag3 = derive_flag('abcd')
    assert flag1 == flag2
    assert flag1 != flag3


def test_binary_mutator_appends_chunk(tmp_path):
    source = tmp_path / 'source.bin'
    source.write_bytes(b'HELLO')
    output = tmp_path / 'mut.bin'
    mutate_binary(str(source), str(output), 'seed')
    data = output.read_bytes()
    assert data.startswith(b'HELLO')
    assert CHUNK_MARKER in data


def test_template_expander_generates_artifacts():
    lab_yaml = {
        'id': 'test',
        'parameters': [{'name': 'SEED', 'type': 'random_hex', 'length': 4}],
        'artifacts': {'flag': 'FLAG-{{SEED}}'}
    }
    params = generate_parameters(lab_yaml, 'abcd')
    artifacts = render_artifacts(lab_yaml, params)
    assert 'flag' in artifacts
    assert params['SEED'] in artifacts['flag']
