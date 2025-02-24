# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs, collect_submodules

datas = [('whisper-tiny-en-openvino', 'whisper-tiny-en-openvino')]
binaries = []
hiddenimports = []

# Collect data files, dynamic libraries, and submodules for openvino_genai
datas += collect_data_files('openvino_genai')
binaries += collect_dynamic_libs('openvino_genai')
hiddenimports += collect_submodules('openvino_genai')

# Collect dynamic libraries for openvino_tokenizers
binaries += collect_dynamic_libs('openvino_tokenizers')

# Ensure the _internal directory is included
datas += collect_data_files('_internal')

# Ensure PyTorch is included
hiddenimports += collect_submodules('torch')

a = Analysis(
    ['live-match-api.py'],
    pathex=['.'],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='live-match-api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='live-match-api',
)