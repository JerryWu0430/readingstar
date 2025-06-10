# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs, collect_submodules

datas = [('whisper-tiny-en-openvino', 'whisper-tiny-en-openvino')]
datas += [('playlists.json', '.')]
datas += [('all-MiniLM-L6-v2-openvino', 'all-MiniLM-L6-v2-openvino')]
binaries = []

hiddenimports = [
    'uvicorn.lifespan.off','uvicorn.lifespan.on','uvicorn.lifespan',
    'uvicorn.protocols.websockets.auto','uvicorn.protocols.websockets.wsproto_impl',
    'uvicorn.protocols.websockets_impl','uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl','uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.websockets','uvicorn.protocols.http','uvicorn.protocols',
    'uvicorn.loops.auto','uvicorn.loops.asyncio','uvicorn.loops.uvloop','uvicorn.loops',
    'uvicorn.logging',
    'live_match_api',
]

# Comprehensive OpenVINO GenAI collection
print("Collecting openvino_genai...")
try:
    datas += collect_data_files('openvino_genai')
    binaries += collect_dynamic_libs('openvino_genai')
    hiddenimports += collect_submodules('openvino_genai')
    print("openvino_genai collected successfully")
except Exception as e:
    print(f"Error collecting openvino_genai: {e}")

# Collect OpenVINO core
print("Collecting openvino...")
try:
    datas += collect_data_files('openvino')
    binaries += collect_dynamic_libs('openvino')
    hiddenimports += collect_submodules('openvino')
    print("openvino collected successfully")
except Exception as e:
    print(f"Error collecting openvino: {e}")

# Collect openvino_tokenizers
print("Collecting openvino_tokenizers...")
try:
    datas += collect_data_files('openvino_tokenizers')
    binaries += collect_dynamic_libs('openvino_tokenizers')
    hiddenimports += collect_submodules('openvino_tokenizers')
    print("openvino_tokenizers collected successfully")
except Exception as e:
    print(f"Error collecting openvino_tokenizers: {e}")

# Find and include all OpenVINO DLLs manually
def find_openvino_dlls():
    """Find all OpenVINO-related DLLs in the environment"""
    import site
    import glob
    
    dll_paths = []
    
    # Get all site-packages directories
    for site_dir in site.getsitepackages():
        # Look for OpenVINO DLLs
        patterns = [
            os.path.join(site_dir, 'openvino*', '**', '*.dll'),
            os.path.join(site_dir, 'openvino*', '*.dll'),
            os.path.join(site_dir, '*openvino*', '**', '*.dll'),
            os.path.join(site_dir, '*openvino*', '*.dll'),
        ]
        
        for pattern in patterns:
            dll_paths.extend(glob.glob(pattern, recursive=True))
    
    return dll_paths

# Add all found OpenVINO DLLs
openvino_dlls = find_openvino_dlls()
for dll_path in openvino_dlls:
    if os.path.exists(dll_path):
        binaries.append((dll_path, '.'))
        print(f"Added DLL: {dll_path}")

# Add comprehensive optimum modules
print("Collecting optimum...")
try:
    datas += collect_data_files('optimum')
    binaries += collect_dynamic_libs('optimum')
    hiddenimports += collect_submodules('optimum')
except Exception as e:
    print(f"Error collecting optimum: {e}")

# Handle missing openvino.tools.mo gracefully
try:
    import openvino.tools.mo
    hiddenimports += ['openvino.tools.mo']
    datas += collect_data_files('openvino.tools.mo')
    hiddenimports += collect_submodules('openvino.tools.mo')
    print("openvino.tools.mo found and collected")
except ImportError:
    print("Warning: openvino.tools.mo not found, will be patched in code")

# Essential modules
hiddenimports += [
    'numpy',
    'numpy.core',
    'numpy.core._methods',
    'numpy.lib.format',
    'scipy.sparse.linalg.dsolve.linsolve',
    'scipy.sparse.csgraph._validation',
    'transformers.tokenization_utils',
    'transformers.tokenization_utils_base',
    'transformers.configuration_utils',
    'transformers.modeling_utils',
    'transformers.file_utils',
    'transformers.utils.hub',
    'transformers.utils.doc',
    'transformers.dependency_versions_check',
]

# Collect PyTorch and SciPy
try:
    hiddenimports += collect_submodules('torch')
    binaries += collect_dynamic_libs('torch')
    datas += collect_data_files('torch')
except Exception as e:
    print(f"Error collecting torch: {e}")

try:
    hiddenimports += collect_submodules('scipy')
    binaries += collect_dynamic_libs('scipy')
except Exception as e:
    print(f"Error collecting scipy: {e}")

# System DLLs
dll_path = r'C:\Windows\System32'
system_dlls = [
    'vcruntime140.dll',
    'msvcp140.dll',
    'vcruntime140_1.dll',
    'msvcp140_1.dll',
    'msvcp140_2.dll',
    'vcruntime140_threads.dll',
]

for dll in system_dlls:
    dll_full_path = os.path.join(dll_path, dll)
    if os.path.exists(dll_full_path):
        binaries.append((dll_full_path, '.'))
        print(f"Added system DLL: {dll}")

a = Analysis(
    ['live_match_api.py'],
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
    a.binaries,
    a.datas,
    [],
    name='live_match_api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # Disable UPX to avoid DLL corruption
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
)