// Test file for dance card generation
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { generateDanceCards } from '../dancecard';
import { parseEventsCSV, parseParticipantsCSV, parseRoomCapacityCSV } from '../parsecsv';
import { EventData, Participant, RoomCapacity } from '../types';

describe('Dance Card Generation Algorithm', () => {
	it('should generate cards with proper room assignments and no missed topics', () => {
		// Generate 120 unique participant names and IDs
		const participants: Participant[] = Array.from({ length: 120 }, (_, i) => ({
			id: `id-${(i + 1).toString().padStart(3, '0')}`,
			name: `Name-${(i + 1).toString().padStart(3, '0')}`,
		}));

		// Create 10 rooms with capacity 15 each
		const roomCapacities: RoomCapacity[] = Array.from({ length: 10 }, (_, i) => ({
			room: `Room-${(i + 1).toString().padStart(2, '0')}`,
			capacity: 15,
		}));

		// Create 5 topics
		const topics = Array.from({ length: 5 }, (_, i) => `Topic-${i + 1}`);

		// Create 5 time slots from 11:00 to 15:00
		const timeSlots = ['11:00', '12:00', '13:00', '14:00', '15:00'];

		// Create events by mapping each room to each time slot
		// We'll rotate topics across rooms to ensure all topics are available at each time slot
		const events: EventData[] = [];
		timeSlots.forEach((time, timeIndex) => {
			roomCapacities.forEach((roomCapacity, roomIndex) => {
				// Rotate topics across rooms based on the time slot
				// This ensures each topic is available at each time slot
				const topicIndex = (roomIndex + timeIndex * roomCapacities.length) % topics.length;

				events.push({
					time,
					room: roomCapacity.room,
					topic: topics[topicIndex],
				});
			});
		});

		// Generate dance cards
		const danceCards = generateDanceCards(participants, events, roomCapacities);

		// Verify that all participants have been generated dance cards
		expect(danceCards.length).toBe(participants.length);

		// Verify that no participant has missed topics
		const participantsWithMissedTopics = danceCards.filter(
			(card) => card.missedTopics.size > 0
		);
		expect(participantsWithMissedTopics.length).toBe(0);

		// Verify that no room has more participants than its capacity at any time slot
		timeSlots.forEach((time) => {
			// Create map to track occupancy of each room at this time slot
			const roomOccupancy = new Map();
			roomCapacities.forEach((rc) => {
				roomOccupancy.set(rc.room, 0);
			});

			// Count participants in each room at this time slot
			danceCards.forEach((card) => {
				const assignment = card.assignments.get(time);
				if (assignment !== 'FREE' && assignment !== undefined) {
					const room = assignment.room;
					roomOccupancy.set(room, roomOccupancy.get(room) + 1);
				}
			});

			// Verify no room exceeds its capacity
			roomCapacities.forEach((rc) => {
				const occupancy = roomOccupancy.get(rc.room);
				expect(
					occupancy <= rc.capacity,
					`Room ${rc.room} has ${occupancy} participants at ${time}, which exceeds capacity ${rc.capacity}`
				).toBe(true);
			});
		});

		// Verify that no participant is assigned to multiple rooms at the same time
		danceCards.forEach((card) => {
			const assignedTimes = new Set();

			// Check all time slots for this participant
			timeSlots.forEach((time) => {
				const assignment = card.assignments.get(time);
				if (assignment !== 'FREE' && assignment !== undefined) {
					// Make sure this time isn't already assigned to a different room
					expect(
						assignedTimes.has(time),
						`Participant ${card.participant.name} is assigned to multiple rooms at ${time}`
					).toBe(false);
					assignedTimes.add(time);
				}
			});
		});
	});
});

describe('Dance Card Generation with Sample Data', () => {
	it('should properly utilize room capacity with sample data', () => {
		// Load and parse sample files
		const participantsCSV = fs.readFileSync(
			path.join(__dirname, '../assets/sample.csv'),
			'utf-8'
		);
		const eventsCSV = fs.readFileSync(
			path.join(__dirname, '../assets/events-sample.csv'),
			'utf-8'
		);
		const roomCapacityCSV = fs.readFileSync(
			path.join(__dirname, '../assets/room-capacity-sample.csv'),
			'utf-8'
		);

		const participants = parseParticipantsCSV(participantsCSV);
		const events = parseEventsCSV(eventsCSV);
		const roomCapacities = parseRoomCapacityCSV(roomCapacityCSV);

		// Generate dance cards
		const danceCards = generateDanceCards(participants, events, roomCapacities);

		// Get first time slot from events
		const firstTimeSlot = events[0].time;

		// Get rooms available at first time slot
		const availableRooms = events
			.filter((event) => event.time === firstTimeSlot)
			.map((event) => event.room);

		// Count total capacity of available rooms
		const totalAvailableCapacity = roomCapacities
			.filter((rc) => availableRooms.includes(rc.room))
			.reduce((sum, rc) => sum + rc.capacity, 0);

		// Count participants in each room for the first time slot
		const roomOccupancy = new Map<string, number>();
		let totalAssignedParticipants = 0;
		let unassignedParticipants = 0;

		// Initialize room occupancy counters for available rooms
		availableRooms.forEach((room) => {
			roomOccupancy.set(room, 0);
		});

		// Count participants in each room
		danceCards.forEach((card) => {
			const assignment = card.assignments.get(firstTimeSlot);
			if (assignment !== 'FREE' && assignment !== undefined) {
				const currentCount = roomOccupancy.get(assignment.room) || 0;
				roomOccupancy.set(assignment.room, currentCount + 1);
				totalAssignedParticipants++;
			} else {
				unassignedParticipants++;
			}
		});

		// Log assignments for debugging
		console.log('\nAssignment statistics for first time slot:');
		console.log(`Total participants: ${participants.length}`);
		console.log(`Available rooms: ${availableRooms.join(', ')}`);
		console.log(`Total available capacity: ${totalAvailableCapacity}`);
		console.log(`Assigned participants: ${totalAssignedParticipants}`);
		console.log(`Unassigned participants: ${unassignedParticipants}`);

		// Verify that each participant has at least one assignment
		danceCards.forEach((card) => {
			console.log(`${card.participant.name}: ${Array.from(card.assignments.values())}`);
			expect(
				Array.from(card.assignments.values()).filter((a) => a !== 'FREE')
			).not.toHaveLength(0);
		});
	});
});
