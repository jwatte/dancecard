import { parseCSVGeneric, parseEventsCSV, parseRoomCapacityCSV } from '../parsecsv';

describe('CSV Parsing', () => {
	describe('Room Capacity CSV', () => {
		it('should skip rows with empty capacity', () => {
			const csv = 'Room,Capacity\nRoom A,\nRoom B,50';
			const result = parseRoomCapacityCSV(csv);
			expect(result).toEqual([{ room: 'Room B', capacity: 50 }]);
		});

		it('should throw error for missing capacity column', () => {
			const csv = 'Room,Capacity\nRoom A';
			expect(() => parseRoomCapacityCSV(csv)).toThrow(
				'Line 2: Missing required fields (Room, Capacity)'
			);
		});

		it('should throw error for invalid capacity value', () => {
			const csv = 'Room,Capacity\nRoom A,invalid';
			expect(() => parseRoomCapacityCSV(csv)).toThrow(
				'Line 2: Invalid capacity value "invalid" for room "Room A". Capacity must be a number.'
			);
		});
	});

	describe('Events CSV', () => {
		it('should throw error for room-time conflicts', () => {
			const csv = 'Time,Topic,Room\n09:00,Topic A,Room 1\n09:00,Topic B,Room 1';
			expect(() => parseEventsCSV(csv)).toThrow(
				'Line 3: Room "Room 1" is already scheduled for time 09:00'
			);
		});
	});
});

describe('Generic CSV Parser', () => {
	it('should parse CSV with standard column order', () => {
		const csv = 'Name,ID,Age\nJohn,001,25\nJane,002,30';
		const result = parseCSVGeneric(csv);

		expect(result.indices).toEqual({
			name: 0,
			id: 1,
			age: 2,
		});
		expect(result.rows).toEqual([
			['John', '001', '25'],
			['Jane', '002', '30'],
		]);
	});

	it('should parse CSV with different column order', () => {
		const csv = 'Age,Name,ID\n25,John,001\n30,Jane,002';
		const result = parseCSVGeneric(csv);

		expect(result.indices).toEqual({
			age: 0,
			name: 1,
			id: 2,
		});
		expect(result.rows).toEqual([
			['25', 'John', '001'],
			['30', 'Jane', '002'],
		]);
	});

	it('should ignore additional columns', () => {
		const csv = 'Name,ID,Age,Extra1,Extra2\nJohn,001,25,x1,x2\nJane,002,30,y1,y2';
		const result = parseCSVGeneric(csv);

		expect(result.indices).toEqual({
			name: 0,
			id: 1,
			age: 2,
			extra1: 3,
			extra2: 4,
		});
		expect(result.rows).toEqual([
			['John', '001', '25', 'x1', 'x2'],
			['Jane', '002', '30', 'y1', 'y2'],
		]);
	});

	it('should handle empty cells', () => {
		const csv = 'Name,ID,Age\nJohn,,25\nJane,002,';
		const result = parseCSVGeneric(csv);

		expect(result.indices).toEqual({
			name: 0,
			id: 1,
			age: 2,
		});
		expect(result.rows).toEqual([
			['John', '', '25'],
			['Jane', '002', ''],
		]);
	});

	it('should skip empty lines and handle different line endings', () => {
		const csv = 'Name,ID,Age\r\nJohn,001,25\n\r\n\nJane,002,30\r\n\n\n';
		const result = parseCSVGeneric(csv);

		expect(result.indices).toEqual({
			name: 0,
			id: 1,
			age: 2,
		});
		expect(result.rows).toEqual([
			['John', '001', '25'],
			['Jane', '002', '30'],
		]);
	});

	it('should throw error for empty CSV', () => {
		const csv = '';
		expect(() => parseCSVGeneric(csv)).toThrow('CSV file is empty');
	});

	it('should handle CSV with only header', () => {
		const csv = 'Name,ID,Age';
		const result = parseCSVGeneric(csv);

		expect(result.indices).toEqual({
			name: 0,
			id: 1,
			age: 2,
		});
		expect(result.rows).toEqual([]);
	});

	it('should handle whitespace in headers and cells', () => {
		const csv = ' Name , ID , Age \n John , 001 , 25 \n Jane , 002 , 30 ';
		const result = parseCSVGeneric(csv);

		expect(result.indices).toEqual({
			name: 0,
			id: 1,
			age: 2,
		});
		expect(result.rows).toEqual([
			['John', '001', '25'],
			['Jane', '002', '30'],
		]);
	});
});

describe('CSV Row Parsing', () => {
	it('should handle simple unquoted fields', () => {
		const csv = 'Name,ID,Age\nJohn,001,25';
		const result = parseCSVGeneric(csv);
		expect(result.rows[0]).toEqual(['John', '001', '25']);
	});

	it('should handle quoted fields with commas', () => {
		const csv = 'Name,Description\n"Smith, John","Senior, Developer"';
		const result = parseCSVGeneric(csv);
		expect(result.rows[0]).toEqual(['Smith, John', 'Senior, Developer']);
	});

	it('should handle escaped quotes in quoted fields', () => {
		const csv = 'Quote,Author\n"He said ""Hello"" to me","John Smith"';
		const result = parseCSVGeneric(csv);
		expect(result.rows[0]).toEqual(['He said "Hello" to me', 'John Smith']);
	});

	it('should handle newlines in quoted fields', () => {
		const csv = 'Name,Bio\n"John Doe","Line 1\nLine 2\nLine 3"';
		const result = parseCSVGeneric(csv);
		expect(result.rows[0]).toEqual(['John Doe', 'Line 1\nLine 2\nLine 3']);
	});

	it('should throw error for unclosed quotes', () => {
		const csv = 'Name,Quote\nJohn,"unclosed';
		expect(() => parseCSVGeneric(csv)).toThrow('Unclosed quote');
	});

	it('should throw error for invalid quotes in middle of field', () => {
		const csv = 'Name,Quote\nJo"hn,normal';
		expect(() => parseCSVGeneric(csv)).toThrow('Invalid quote in the middle of field');
	});
});
