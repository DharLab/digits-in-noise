import argparse
import csv
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent


def resolve(path):
    p = Path(path)
    return p if p.is_absolute() else SCRIPT_DIR / p


def fix_snr_offset(input_path, output_path, col_data, col_srt, col_label):
    with open(input_path, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        rows = list(reader)

    # Warn early if expected columns are missing
    for col in [col_data, col_srt]:
        if col not in fieldnames:
            print(f"WARNING: column '{col}' not found in CSV. Available columns: {', '.join(fieldnames)}")

    changed = 0
    skipped = 0

    for row in rows:
        label = row.get(col_label, '?')
        din_data_str = row.get(col_data, '').strip()

        if not din_data_str:
            skipped += 1
            continue

        try:
            din_data = json.loads(din_data_str)
        except json.JSONDecodeError:
            print(f"  WARNING: could not parse {col_data} for row '{label}', skipping.")
            skipped += 1
            continue

        responses = din_data.get('responses', [])
        if len(responses) < 7:
            print(f"  WARNING: fewer than 7 responses for row '{label}', skipping.")
            skipped += 1
            continue

        offset = responses[0]['snr']
        if offset == 0:
            continue

        # Shift all SNRs by the first trial's SNR so that trial 1 starts at 0
        for r in responses:
            r['snr'] -= offset

        # Recalculate SRT: average of trials 7-25 (index 6 onwards)
        srt_snrs = [r['snr'] for r in responses[6:]]
        new_srt = sum(srt_snrs) / len(srt_snrs)

        old_srt = din_data.get('srt', '?')
        din_data['srt'] = new_srt
        row[col_data] = json.dumps(din_data)
        row[col_srt] = new_srt

        print(f"  Fixed row '{label}': offset={offset:+d}, SRT {old_srt:.4f} -> {new_srt:.4f}")
        changed += 1

    with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone. {changed} rows adjusted, {skipped} rows skipped (no {col_data}). Output: {output_path}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Fix DIN SNR offset so all trials start at SNR=0.')
    parser.add_argument('input',            help='Input CSV file')
    parser.add_argument('output',           help='Output CSV file')
    parser.add_argument('--col-data',       default='din_data',               help='Column containing the DIN JSON blob (default: din_data)')
    parser.add_argument('--col-srt',        default='din_srt',                help='Column containing the SRT value (default: din_srt)')
    parser.add_argument('--col-label',      default='consent_study_sign_date', help='Column used to label rows in log output (default: consent_study_sign_date)')
    args = parser.parse_args()

    fix_snr_offset(
        resolve(args.input),
        resolve(args.output),
        col_data=args.col_data,
        col_srt=args.col_srt,
        col_label=args.col_label,
    )
