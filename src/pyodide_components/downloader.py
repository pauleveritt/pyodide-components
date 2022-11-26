"""Downloads Pyodide and extracts to correct place."""
from pyodide_components import HERE

"""Automation scripts for getting setup."""
import os
import tarfile
from pathlib import Path
from shutil import copytree, rmtree
from tempfile import TemporaryDirectory

from urllib3 import PoolManager


def get_pyodide():
    print("Getting Pyodide")
    base_url = "https://github.com/pyodide/pyodide/releases/download"
    url = f"{base_url}/0.22.0a1/pyodide-0.22.0a1.tar.bz2"
    http = PoolManager()
    r = http.request('GET', url)
    with TemporaryDirectory() as tmp_dir_name:
        os.chdir(tmp_dir_name)
        tmp_dir = Path(tmp_dir_name)
        temp_file = tmp_dir / "pyodide.tar.bz2"
        temp_file.write_bytes(r.data)
        tar = tarfile.open(temp_file)
        tar.extractall()
        target = HERE / "pyodide"
        if target.exists():
            rmtree(target)
        copytree(tmp_dir / "pyodide", target)


if __name__ == '__main__':
    get_pyodide()
