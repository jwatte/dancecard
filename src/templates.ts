// Main app structure
export const createAppStructure = (): string => `
    <div class="time-schedule" id="dance-card-container">
        <button id="help-icon" class="help-icon">?</button>
        <button id="dance-card-button" class="dance-card-button" disabled>Generate Dance Cards</button>
        <span id="button-hint" class="hint"></span>
    </div>

    <div class="grid-container">
        <div class="grid-item upload-section">
            <h2>Participants</h2>
			<p class="hint">Participants CSV should have ID and Name columns</p>
            <div class="file-input-container">
                <input type="file" id="participants-upload" accept=".csv">
                <label for="participants-upload">Choose Participants CSV</label>
                <span id="participants-error" class="file-error"></span>
            </div>
            <div class="file-actions">
                <a href="sample.csv" class="download-link" download>Download Sample CSV</a>
            </div>
        </div>

        <div class="grid-item upload-section">
            <h2>Events</h2>
			<p class="hint">Events CSV should have Time, Topic, and Room columns</p>
            <div class="file-input-container">
                <input type="file" id="events-upload" accept=".csv">
                <label for="events-upload">Choose Events CSV</label>
                <span id="events-error" class="file-error"></span>
            </div>
            <div class="file-actions">
                <a href="events-sample.csv" class="download-link" download>Download Sample CSV</a>
            </div>
        </div>

        <div class="grid-item upload-section">
            <h2>Room Capacities</h2>
			<p class="hint">Room Capacity CSV should have Room and Capacity columns</p>
            <div class="file-input-container">
                <input type="file" id="room-capacities-upload" accept=".csv">
                <label for="room-capacities-upload">Choose Room Capacities CSV</label>
                <span id="room-capacities-error" class="file-error"></span>
            </div>
            <div class="file-actions">
                <a href="room-capacity-sample.csv" class="download-link" download>Download Sample CSV</a>
            </div>
        </div>
    </div>

	<!-- Data display section -->
	<div class="grid-container">
		<!-- Left column: Participants display -->
		<div class="grid-item">
			<div id="participant-list" class="data-list">
				<p>No participants loaded. Please upload a CSV file.</p>
			</div>
		</div>
		<!-- Middle column: Events display -->
		<div class="grid-item">
			<div id="events-list" class="data-list">
				<p>No events loaded. Please upload a CSV file.</p>
			</div>
		</div>
		<!-- Right column: Room Capacity display -->
		<div class="grid-item">
			<div id="room-capacity-list" class="data-list">
				<p>No room capacities loaded. Please upload a CSV file.</p>
			</div>
		</div>
	</div>
`;
// Help content template
export const createHelpContent = (): string => `
    <div class="app-description" id="app-description">
        <button id="close-description" class="close-button">&times;</button>
        <p>This application helps organizers assign participants to different rooms and topics for events with multiple concurrent sessions.</p>
        <div class="instructions">
            <h2>How to use:</h2>
            <ol>
                <li>Upload a <strong>Participants CSV</strong> file with ID and Name columns</li>
                <li>Upload an <strong>Events CSV</strong> file with Time, Topic, and Room columns (accepts both 12-hour or 24-hour time formats)</li>
                <li>Upload a <strong>Room Capacity CSV</strong> file with Room and Capacity columns</li>
                <li>Click the <strong>Dance Cards</strong> button to generate assignments</li>
                <li>Download the results using the <strong>Export CSV</strong> button</li>
            </ol>
            <p>The system will ensure participants don't see the same topic twice and will respect room capacity limits.</p>
        </div>
    </div>`;

// Events table template
export const createEventsTableHeader = (): string => `
    <thead>
        <tr>
            <th>Topic</th>
            <th>Room</th>
            <th>Available Times</th>
        </tr>
    </thead>`;

export const createTimeScheduleHeader = (): string => `
    <thead>
        <tr>
            <th>Time</th>
            <th>Topic</th>
            <th>Room</th>
        </tr>
    </thead>`;

// Dance card results header
export const createDanceCardResultsHeader = (count: number): string => `
    <div class="results-header">
        <h2>Generated Dance Cards</h2>
        <p class="results-summary">${count} participants assigned</p>
    </div>`;

// Missed topics table header
export const createMissedTopicsHeader = (): string => `
    <div class="missed-topics-section">
        <h3>Participants Missing Topics</h3>
        <table class="missed-topics-table">
            <thead>
                <tr>
                    <th>Participant</th>
                    <th>Missed Topics</th>
                </tr>
            </thead>
        </table>
    </div>`;

// Participant table header
export const createParticipantTableHeader = (): string => `
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
        </tr>
    </thead>`;

// Room capacity table header
export const createRoomCapacityTableHeader = (): string => `
    <thead>
        <tr>
            <th>Room</th>
            <th>Capacity</th>
        </tr>
    </thead>`;
