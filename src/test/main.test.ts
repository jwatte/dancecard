import { readFileSync } from "node:fs";
import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../main';
import { validateAndNormalizeTime } from '../utils';
import { parseParticipantsCSV, parseEventsCSV } from '../parsecsv';

describe('Main application', () => {
	beforeEach(() => {
		// Set up the DOM for testing
		document.body.innerHTML = `<div id="app"></div>`;
	});
	
	it('should initialize the app with both file upload sections', () => {
		// Call the exported init function directly
		initApp();
		
		// Try to find the expected elements
		const participantsInput = document.getElementById('participants-upload');
		const eventsInput = document.getElementById('events-upload');
		const participantList = document.getElementById('participant-list');
		const eventsList = document.getElementById('events-list');
		
		// Check that these elements exist
		expect(participantsInput).not.toBeNull();
		expect(eventsInput).not.toBeNull();
		expect(participantList).not.toBeNull();
		expect(eventsList).not.toBeNull();
	});
	
	describe('Participants CSV Parser', () => {
		it('should parse valid participants CSV data correctly', () => {
			const csvContent = 'ID,Name\n001,John Doe\n002,Jane Smith';
			const result = parseParticipantsCSV(csvContent);
			
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ id: '001', name: 'John Doe' });
			expect(result[1]).toEqual({ id: '002', name: 'Jane Smith' });
		});
		
		it('should handle empty lines in participants CSV', () => {
			const csvContent = 'ID,Name\n001,John Doe\n\n002,Jane Smith\n';
			const result = parseParticipantsCSV(csvContent);
			
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ id: '001', name: 'John Doe' });
			expect(result[1]).toEqual({ id: '002', name: 'Jane Smith' });
		});
		
		it('should throw error with invalid participants CSV headers', () => {
			const csvContent = 'Code,FullName\n001,John Doe';
			
			expect(() => parseParticipantsCSV(csvContent)).toThrow('Participants CSV file must have "ID" and "Name" columns');
		});
	});
	
	describe('Time Format Validation', () => {
		it('should validate and normalize 12-hour AM times', () => {
			expect(validateAndNormalizeTime('9:30 AM')).toBe('09:30');
			expect(validateAndNormalizeTime('11:45 am')).toBe('11:45');
			expect(validateAndNormalizeTime('12:00 AM')).toBe('00:00');
			expect(validateAndNormalizeTime('12:30 a.m.')).toBe('00:30');
		});
		
		it('should validate and normalize 12-hour PM times', () => {
			expect(validateAndNormalizeTime('1:30 PM')).toBe('13:30');
			expect(validateAndNormalizeTime('3:45 pm')).toBe('15:45');
			expect(validateAndNormalizeTime('12:15 PM')).toBe('12:15');
			expect(validateAndNormalizeTime('9:05 p.m.')).toBe('21:05');
		});
		
		it('should accept and normalize 24-hour format times', () => {
			expect(validateAndNormalizeTime('00:00')).toBe('00:00');
			expect(validateAndNormalizeTime('13:30')).toBe('13:30');
			expect(validateAndNormalizeTime('9:45')).toBe('09:45');
			expect(validateAndNormalizeTime('23:59')).toBe('23:59');
		});
		
		it('should throw error for invalid time formats', () => {
			expect(() => validateAndNormalizeTime('13:30 PM')).toThrow('Invalid time format');
			expect(() => validateAndNormalizeTime('25:00')).toThrow('Invalid time format');
			expect(() => validateAndNormalizeTime('9-30')).toThrow('Invalid time format');
			expect(() => validateAndNormalizeTime('9:60')).toThrow('Invalid time format');
			expect(() => validateAndNormalizeTime('9 AM')).toThrow('Invalid time format');
		});
	});
	
	describe('Events CSV Parser', () => {
		it('should parse valid events CSV data with 12-hour times', () => {
			const csvContent = 'Time,Topic,Room\n9:00 AM,JavaScript,Room A\n10:30 AM,TypeScript,Room B';
			const result = parseEventsCSV(csvContent);
			
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ time: '09:00', topic: 'JavaScript', room: 'Room A' });
			expect(result[1]).toEqual({ time: '10:30', topic: 'TypeScript', room: 'Room B' });
		});
		
		it('should parse valid events CSV data with 24-hour times', () => {
			const csvContent = 'Time,Topic,Room\n09:00,JavaScript,Room A\n14:30,TypeScript,Room B';
			const result = parseEventsCSV(csvContent);
			
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ time: '09:00', topic: 'JavaScript', room: 'Room A' });
			expect(result[1]).toEqual({ time: '14:30', topic: 'TypeScript', room: 'Room B' });
		});
		
		it('should handle empty lines in events CSV', () => {
			const csvContent = 'Time,Topic,Room\n9:00 AM,JavaScript,Room A\n\n10:30 AM,TypeScript,Room B\n';
			const result = parseEventsCSV(csvContent);
			
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ time: '09:00', topic: 'JavaScript', room: 'Room A' });
			expect(result[1]).toEqual({ time: '10:30', topic: 'TypeScript', room: 'Room B' });
		});
		
		it('should throw error for invalid time format', () => {
			const csvContent = 'Time,Topic,Room\n9-00,JavaScript,Room A';
			
			expect(() => parseEventsCSV(csvContent)).toThrow('Invalid time format');
		});
		
		it('should throw error with invalid events CSV headers', () => {
			const csvContent = 'Start,Subject,Location\n9:00 AM,JavaScript,Room A';
			
			expect(() => parseEventsCSV(csvContent)).toThrow('Events CSV file must have "Time", "Topic", and "Room" columns');
		});
	});
});
