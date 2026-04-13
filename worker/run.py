"""
Entrypoint for local runs and GitHub Actions.
Usage:
    python run.py
    TEST_MODE=true python run.py
"""
import asyncio
import sys

from sync import sync_all


def main() -> int:
    try:
        asyncio.run(sync_all())
        return 0
    except Exception as exc:
        print(f"::error::{exc}" if __import__("os").environ.get("GITHUB_ACTIONS") else f"Error: {exc}",
              file=sys.stderr, flush=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
