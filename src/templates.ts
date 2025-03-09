// Main app structure
export const createAppStructure = (): string => `
		<!-- Dance Cards button section -->
		<div class="dance-card-container">
			<button id="dance-card-button" class="dance-card-button button-disabled" disabled>Dance Cards</button>
			<p id="button-hint" class="button-hint">Upload all CSV files to enable</p>
		</div>

		<!-- File upload section -->
		<div class="grid-container grid-container-3col">
			<!-- Left column: Participants upload -->
			<div class="grid-item csv-upload">
				<div class="upload-section">
					<h2>Upload Participants</h2>
					<p>Select a CSV file with ID and Name columns:</p>
					<div class="file-input-container">
						<input type="file" id="participants-upload" accept=".csv,text/csv" />
						<label for="participants-upload">Choose File</label>
						<div id="participants-error" class="file-error"></div>
					</div>
					<p class="hint">CSV format requires ID and Name columns.</p>
					<div class="file-actions">
						<a href="sample.csv" download="sample.csv" class="download-link">Download Sample CSV</a>
					</div>
				</div>
			</div>
			
			<!-- Middle column: Events upload -->
			<div class="grid-item csv-upload">
				<div class="upload-section">
					<h2>Upload Events</h2>
					<p>Select a CSV file with Time, Topic, and Room columns:</p>
					<div class="file-input-container">
						<input type="file" id="events-upload" accept=".csv,text/csv" />
						<label for="events-upload">Choose File</label>
						<div id="events-error" class="file-error"></div>
					</div>
					<p class="hint">CSV format requires Time, Topic, and Room columns.</p>
					<div class="file-actions">
						<a href="events-sample.csv" download="events-sample.csv" class="download-link">Download Sample CSV</a>
					</div>
				</div>
			</div>
			
			<!-- Right column: Room Capacity upload -->
			<div class="grid-item csv-upload">
				<div class="upload-section">
					<h2>Upload Room Capacity</h2>
					<p>Select a CSV file with Room and Capacity columns:</p>
					<div class="file-input-container">
						<input type="file" id="room-capacity-upload" accept=".csv,text/csv" />
						<label for="room-capacity-upload">Choose File</label>
						<div id="room-capacity-error" class="file-error"></div>
					</div>
					<p class="hint">CSV format requires Room and Capacity columns. Capacity must be 1-999.</p>
					<div class="file-actions">
							<a href="room-capacity-sample.csv" download="room-capacity-sample.csv" class="download-link">Download Sample CSV</a>
					</div>
                </div>
			</div>
		</div>

		<!-- Data display section -->
		<div class="grid-container grid-container-3col">
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
		</div>`;

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
