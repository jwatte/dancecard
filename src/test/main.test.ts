import { describe, it, expect, beforeEach } from 'vitest';
import { parseParticipantsCSV, parseEventsCSV, initApp } from '../main';

describe('Main application', () => {
	beforeEach(() => {
		// Set up the DOM for testing
		document.body.innerHTML = '<div id="app"></div>';
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
	
	describe('Events CSV Parser', () => {
		it('should parse valid events CSV data correctly', () => {
			const csvContent = 'Time,Topic,Room\n9:00 AM,JavaScript,Room A\n10:30 AM,TypeScript,Room B';
			const result = parseEventsCSV(csvContent);
			
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ time: '9:00 AM', topic: 'JavaScript', room: 'Room A' });
			expect(result[1]).toEqual({ time: '10:30 AM', topic: 'TypeScript', room: 'Room B' });
		});
		
		it('should handle empty lines in events CSV', () => {
			const csvContent = 'Time,Topic,Room\n9:00 AM,JavaScript,Room A\n\n10:30 AM,TypeScript,Room B\n';
			const result = parseEventsCSV(csvContent);
			
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ time: '9:00 AM', topic: 'JavaScript', room: 'Room A' });
			expect(result[1]).toEqual({ time: '10:30 AM', topic: 'TypeScript', room: 'Room B' });
		});
		
		it('should throw error with invalid events CSV headers', () => {
			const csvContent = 'Start,Subject,Location\n9:00 AM,JavaScript,Room A';
			
			expect(() => parseEventsCSV(csvContent)).toThrow('Events CSV file must have "Time", "Topic", and "Room" columns');
		});
	});
});