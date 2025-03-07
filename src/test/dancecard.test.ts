// Test file for dance card generation
import { describe, it, expect } from 'vitest';
import { generateDanceCards } from '../dancecard';
import { Participant, Event, RoomCapacity } from '../types';

describe('Dance Card Generation Algorithm', () => {
	it('should generate cards with proper room assignments and no missed topics', () => {
		// Generate 30 unique participant names and IDs
		const participants: Participant[] = Array.from({ length: 30 }, (_, i) => ({
			id: `id-${(i + 1).toString().padStart(2, '0')}`,
			name: `Name-${(i + 1).toString().padStart(2, '0')}`
		}));
		
		// Create 6 rooms with capacity 5 each
		const roomCapacities: RoomCapacity[] = Array.from({ length: 6 }, (_, i) => ({
			room: `Room-${i + 1}`,
			capacity: 5
		}));
		
		// Create 3 topics
		const topics = Array.from({ length: 3 }, (_, i) => `Topic-${i + 1}`);
		
		// Create 3 time slots from 11:00 to 13:00
		const timeSlots = [
			'11:00',
			'12:00',
			'13:00'
		];
		
		// Create events by mapping each room to each time slot
		// We'll rotate topics across rooms to ensure all topics are available at each time slot
		const events: Event[] = [];
		timeSlots.forEach((time, timeIndex) => {
			roomCapacities.forEach((roomCapacity, roomIndex) => {
				// Rotate topics across rooms based on the time slot
				// This ensures each topic is available at each time slot
				const topicIndex = (roomIndex + timeIndex) % topics.length;
				
				events.push({
					time,
					room: roomCapacity.room,
					topic: topics[topicIndex]
				});
			});
		});
		
		// Generate dance cards
		const danceCards = generateDanceCards(participants, events, roomCapacities);
		
		// Verify that all participants have been generated dance cards
		expect(danceCards.length).toBe(participants.length);
		
		// Verify that no participant has missed topics
		const participantsWithMissedTopics = danceCards.filter(card => card.missedTopics.size > 0);
		expect(participantsWithMissedTopics.length).toBe(0);
		
		// Verify that no room has more participants than its capacity at any time slot
		timeSlots.forEach(time => {
			// Create map to track occupancy of each room at this time slot
			const roomOccupancy = new Map();
			roomCapacities.forEach(rc => {
				roomOccupancy.set(rc.room, 0);
			});
			
			// Count participants in each room at this time slot
			danceCards.forEach(card => {
				const assignment = card.assignments.get(time);
				if (assignment !== 'FREE' && assignment !== undefined) {
					const room = assignment.room;
					roomOccupancy.set(room, roomOccupancy.get(room) + 1);
				}
			});
			
			// Verify no room exceeds its capacity
			roomCapacities.forEach(rc => {
				const occupancy = roomOccupancy.get(rc.room);
				expect(occupancy).toBeLessThanOrEqual(rc.capacity, 
					`Room ${rc.room} has ${occupancy} participants at ${time}, which exceeds capacity ${rc.capacity}`);
			});
		});
		
		// Verify that no participant is assigned to multiple rooms at the same time
		danceCards.forEach(card => {
			const assignedTimes = new Set();
			
			// Check all time slots for this participant
			timeSlots.forEach(time => {
				const assignment = card.assignments.get(time);
				if (assignment !== 'FREE' && assignment !== undefined) {
					// Make sure this time isn't already assigned to a different room
					expect(assignedTimes.has(time)).toBe(false, 
						`Participant ${card.participant.name} is assigned to multiple rooms at ${time}`);
					assignedTimes.add(time);
				}
			});
		});
	});
});
