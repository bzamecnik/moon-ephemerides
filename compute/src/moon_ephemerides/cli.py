"""Command line: `moon-ephemerides export` and `moon-ephemerides validate`."""

import argparse
import warnings
from pathlib import Path

from .catalog import build_catalog
from .events import load_ephemeris

DEFAULT_ASTROPIXELS_DIR = (
    Path(__file__).resolve().parents[4] / "moon-earthquake-experiments/data/moon/astropixels.com-ephemeris"
)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="moon-ephemerides", description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    exp = sub.add_parser("export", help="compute the catalog and write it as JSON")
    exp.add_argument("--start", type=int, default=1850, help="first year (default 1850)")
    exp.add_argument("--end", type=int, default=2149, help="last year (default 2149)")
    exp.add_argument("--out", type=Path, default=Path("lunar-events.json"))

    val = sub.add_parser("validate", help="compare with saved astropixels.com tables (1901-2100)")
    val.add_argument("--astropixels", type=Path, default=DEFAULT_ASTROPIXELS_DIR)
    val.add_argument("--out", type=Path, help="also write the report to this file")

    args = parser.parse_args(argv)
    warnings.filterwarnings("ignore", category=DeprecationWarning, module="skyfield")
    ts, eph = load_ephemeris()

    if args.command == "export":
        from .export import write_json

        catalog = build_catalog(eph, ts.utc(args.start, 1, 1), ts.utc(args.end + 1, 1, 1))
        args.out.parent.mkdir(parents=True, exist_ok=True)
        write_json(catalog, args.out)
        print(f"wrote {args.out} ({args.out.stat().st_size / 1e6:.1f} MB)")
    elif args.command == "validate":
        from .validate import validation_report

        # a margin around 1901-2100 so that edge events find their neighbours
        catalog = build_catalog(eph, ts.utc(1900, 12, 1), ts.utc(2101, 1, 31))
        report = validation_report(catalog, args.astropixels)
        print(report)
        if args.out:
            args.out.write_text(report + "\n")
