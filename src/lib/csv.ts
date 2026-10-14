/** Parser CSV mínimo (RFC 4180): comillas, comillas escapadas y comas dentro de campos. */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (quoted) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else quoted = false;
			} else field += ch;
		} else if (ch === '"') quoted = true;
		else if (ch === ',') {
			row.push(field);
			field = '';
		} else if (ch === '\n' || ch === '\r') {
			if (ch === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else field += ch;
	}
	if (field !== '' || row.length) {
		row.push(field);
		rows.push(row);
	}
	return rows.filter((r) => r.length > 1 || r[0] !== '');
}

/** Convierte un CSV con encabezado en objetos. */
export function csvRecords(text: string): Record<string, string>[] {
	const [header, ...rows] = parseCsv(text);
	if (!header) return [];
	return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}
