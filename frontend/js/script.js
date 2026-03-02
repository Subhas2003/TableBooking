 // Store API Base URL
        const API_URL = 'https://tablereserve-api.onrender.com/api';

        let allBookings = [];
        let trendChartInstance = null;
        let timesChartInstance = null;
        let guestsChartInstance = null;

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            document.getElementById('date').min = new Date().toISOString().split('T')[0];

            // Setup chart.js defaults for darker theme
            Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
            Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        });

        function toggleMobileMenu() {
            document.getElementById('mobileMenu').classList.toggle('hidden');
        }

        function scrollToBooking() {
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        }

        function scrollToMenu() {
            document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
        }

        function showToast(title, message, type = 'success') {
            const toast = document.getElementById('toast');
            document.getElementById('toastTitle').textContent = title;
            document.getElementById('toastMessage').textContent = message;

            const iconColor = type === 'success' ? 'text-green-500' : type === 'error' ? 'text-red-500' : 'text-yellow-500';
            const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'alert-circle';

            document.getElementById('toastIcon').innerHTML = `<i data-lucide="${iconName}" class="w-6 h-6 ${iconColor}"></i>`;
            lucide.createIcons();

            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 5000);
        }

        // ---------- USER FLOW ----------
        document.getElementById('reservationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submitBtn');
            const btnText = document.getElementById('btnText');
            const btnLoader = document.getElementById('btnLoader');

            btnText.textContent = 'Processing...';
            btnLoader.classList.remove('hidden');
            submitBtn.disabled = true;

            const payload = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                seats: parseInt(document.getElementById('seats').value),
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                specialRequests: document.getElementById('specialRequests').value
            };

            try {
                const response = await fetch(`${API_URL}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();

                if (data.success) {
                    document.getElementById('bookingForm').classList.add('hidden');
                    document.getElementById('successMessage').classList.remove('hidden');

                    document.getElementById('successName').textContent = data.booking.name;
                    document.getElementById('successPhone').textContent = data.booking.phone;
                    document.getElementById('successDate').textContent = new Date(data.booking.date).toLocaleDateString();
                    document.getElementById('successTime').textContent = data.booking.time;
                    document.getElementById('successSeats').textContent = data.booking.seats + ' Guests';

                    const safeId = data.booking._id ? data.booking._id.slice(-6).toUpperCase() : 'N/A';
                    document.getElementById('successId').textContent = '#' + safeId;

                    showToast('Success!', 'Your reservation has been confirmed.');
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                showToast('Error', error.message || 'Failed to request booking', 'error');
            } finally {
                btnText.textContent = 'Confirm Reservation';
                btnLoader.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });

        function resetBooking() {
            document.getElementById('reservationForm').reset();
            document.getElementById('bookingForm').classList.remove('hidden');
            document.getElementById('successMessage').classList.add('hidden');
            scrollToBooking();
        }

        // ---------- ADMIN & AUTH ----------
        function showAdminLogin() {
            document.getElementById('adminLoginModal').classList.remove('hidden');
            document.getElementById('mobileMenu').classList.add('hidden');
        }

        function closeAdminLogin() {
            document.getElementById('adminLoginModal').classList.add('hidden');
        }

        document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginBtn = document.getElementById('adminLoginBtn');
            const btnText = document.getElementById('adminLoginText');
            const loader = document.getElementById('adminLoginLoader');

            btnText.textContent = 'Logging in...';
            loader.classList.remove('hidden');
            loginBtn.disabled = true;

            const payload = {
                username: document.getElementById('adminUsername').value,
                password: document.getElementById('adminPassword').value
            };

            try {
                const response = await fetch(`${API_URL}/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('adminToken', data.token);
                    document.getElementById('adminLoginForm').reset();
                    closeAdminLogin();
                    showAdminPanel();
                    showToast('Welcome!', 'Logged in successfully');
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                showToast('Login Failed', error.message || 'Invalid username or password', 'error');
            } finally {
                btnText.textContent = 'Login';
                loader.classList.add('hidden');
                loginBtn.disabled = false;
            }
        });

        // Toggle admin panel view
        function showAdminPanel() {
            document.getElementById('adminPanelModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Stop background scrolling
            switchTab('bookingsTab'); // default to bookings view
            loadBookings();
        }

        function logoutAdmin() {
            localStorage.removeItem('adminToken');
            document.getElementById('adminPanelModal').classList.add('hidden');
            document.body.style.overflow = '';
            showToast('Logged Out', 'Session ended safely.');
        }

        window.onclick = function (event) {
            const loginModal = document.getElementById('adminLoginModal');
            if (event.target === loginModal) {
                closeAdminLogin();
            }
        }

        // ---------- ADMIN TABS ----------
        function switchTab(tabId) {
            document.getElementById('bookingsTab').classList.add('hidden');
            document.getElementById('analyticsTab').classList.add('hidden');

            document.getElementById('btnBookingsTab').className = 'bg-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-transparent';
            document.getElementById('btnAnalyticsTab').className = 'bg-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-transparent';

            document.getElementById(tabId).classList.remove('hidden');

            if (tabId === 'bookingsTab') {
                document.getElementById('btnBookingsTab').className = 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-yellow-500/50';
            } else {
                document.getElementById('btnAnalyticsTab').className = 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-yellow-500/50';
                renderAnalytics();
            }
        }

        // ---------- BOOKING FETCH & RENDER ----------
        async function loadBookings() {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await fetch(`${API_URL}/bookings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    allBookings = data.data || [];
                    updateStatsCards();
                    renderBookingsTable();

                    // If analytics tab is active, silently update graphs too
                    if (!document.getElementById('analyticsTab').classList.contains('hidden')) {
                        renderAnalytics();
                    }
                } else {
                    throw new Error(data.message || 'Failed to load bookings');
                }
            } catch (error) {
                showToast('Error', 'Failed to fetch dashboard data', 'error');
                if (error.message.toLowerCase().includes('token')) {
                    logoutAdmin();
                }
            }
        }

        function refreshBookings() {
            loadBookings();
            showToast('Refreshed', 'Latest data loaded.');
        }

        function updateStatsCards() {
            document.getElementById('totalBookings').textContent = allBookings.length;
            document.getElementById('pendingBookings').textContent = allBookings.filter(b => b.status === 'pending').length;
            document.getElementById('confirmedBookings').textContent = allBookings.filter(b => b.status === 'confirmed').length;
            document.getElementById('totalGuests').textContent = allBookings.reduce((sum, b) => sum + (b.seats || 0), 0);
        }

        function renderBookingsTable() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const statusF = document.getElementById('statusFilter').value;
            const dateF = document.getElementById('dateFilter').value;

            const filtered = allBookings.filter(b => {
                const searchMatch = b.name.toLowerCase().includes(searchTerm) || b.email.toLowerCase().includes(searchTerm) || b.phone.includes(searchTerm);
                const statusMatch = !statusF || b.status === statusF;
                let dtMatch = true;
                if (dateF && b.date) {
                    dtMatch = new Date(b.date).toISOString().split('T')[0] === dateF;
                }
                return searchMatch && statusMatch && dtMatch;
            });

            const tbody = document.getElementById('bookingsTableBody');
            const placeholder = document.getElementById('noBookings');

            if (filtered.length === 0) {
                tbody.innerHTML = '';
                placeholder.classList.remove('hidden');
                return;
            }
            placeholder.classList.add('hidden');

            tbody.innerHTML = filtered.map(b => {
                const badgeStyle = {
                    pending: 'bg-yellow-500/20 text-yellow-400',
                    confirmed: 'bg-green-500/20 text-green-400',
                    cancelled: 'bg-red-500/20 text-red-400',
                    completed: 'bg-blue-500/20 text-blue-400'
                };
                return `
                    <tr class="hover:bg-white/5 transition-colors">
                        <td class="p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                                    ${b.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p class="text-white font-medium">${b.name}</p>
                                    <p class="text-gray-500 text-xs text-blue-400">ID: #${b._id ? b._id.slice(-6).toUpperCase() : 'N/A'}</p>
                                </div>
                            </div>
                        </td>
                        <td class="p-4">
                            <p class="text-white text-sm">${b.email}</p>
                            <p class="text-gray-400 text-sm">${b.phone}</p>
                        </td>
                        <td class="p-4">
                            <p class="text-white text-sm">${new Date(b.date).toLocaleDateString()}</p>
                            <p class="text-gray-400 text-sm">${b.time}</p>
                        </td>
                        <td class="p-4">
                            <div class="flex items-center gap-1">
                                <i data-lucide="users" class="w-4 h-4 text-gray-400"></i>
                                <span class="text-white text-sm">${b.seats}</span>
                            </div>
                        </td>
                         <td class="p-4">
                            <select onchange="updateRowStatus('${b._id}', this.value)"
                                class="px-2 py-1 rounded-md text-sm font-medium border-0 cursor-pointer focus:ring-0 ${badgeStyle[b.status] || ''}">
                                <option value="pending" ${b.status === 'pending' ? 'selected' : ''} class="bg-gray-800 text-white">Pending</option>
                                <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''} class="bg-gray-800 text-white">Confirmed</option>
                                <option value="completed" ${b.status === 'completed' ? 'selected' : ''} class="bg-gray-800 text-white">Completed</option>
                                <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''} class="bg-gray-800 text-white">Cancelled</option>
                            </select>
                        </td>
                        <td class="p-4">
                            <button onclick="deleteBookingRow('${b._id}')" class="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-all">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            lucide.createIcons();
        }

        async function updateRowStatus(id, newStatus) {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await fetch(`${API_URL}/bookings/${id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status: newStatus })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Updated', 'Booking status changed to ' + newStatus);
                    loadBookings(); // full reload to update charts/stats too
                } else throw new Error(data.message);
            } catch (e) {
                showToast('Failed to update', e.message, 'error');
            }
        }

        async function deleteBookingRow(id) {
            if (!confirm("Permenantly delete this booking?")) return;
            try {
                const token = localStorage.getItem('adminToken');
                const res = await fetch(`${API_URL}/bookings/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Deleted', 'Booking removed forever.');
                    loadBookings();
                } else throw new Error(data.message);
            } catch (e) {
                showToast('Failed to delete', e.message, 'error');
            }
        }

        document.getElementById('searchInput').addEventListener('input', renderBookingsTable);
        document.getElementById('statusFilter').addEventListener('change', renderBookingsTable);
        document.getElementById('dateFilter').addEventListener('change', renderBookingsTable);


        // ---------- ANALYTICS CHARTS ----------
        function renderAnalytics() {
            // Group data
            // 1. Bookings created per day (using createdAt or date)
            // Using reservation date for better context
            const dateCounts = {};
            const timeCounts = {};
            const guestTally = {};

            // Prepare dynamic dates (last 7 days of reservations)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            allBookings.forEach(b => {
                if (!b.date) return;

                // Bookings count per date
                const dStr = new Date(b.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;

                // Guests per date
                guestTally[dStr] = (guestTally[dStr] || 0) + (b.seats || 0);

                // Most popular times
                if (b.time) {
                    timeCounts[b.time] = (timeCounts[b.time] || 0) + 1;
                }
            });

            // Sort dates appropriately if there's enough data (simple string sort might fail across years, keeping it naive for demo)
            const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b)).slice(-7);

            // Extract chart data vectors
            const trendLabels = sortedDates;
            const trendData = sortedDates.map(d => dateCounts[d]);

            const guestData = sortedDates.map(d => guestTally[d]);

            // Timeslot Pie chart
            const sortedTimes = Object.keys(timeCounts).sort((a, b) => timeCounts[b] - timeCounts[a]).slice(0, 5); // top 5
            const pieLabels = sortedTimes;
            const pieData = sortedTimes.map(t => timeCounts[t]);

            // Clear old charts if they exist
            if (trendChartInstance) trendChartInstance.destroy();
            if (timesChartInstance) timesChartInstance.destroy();
            if (guestsChartInstance) guestsChartInstance.destroy();

            // Render Trend Chart
            const ctx1 = document.getElementById('bookingsTrendChart').getContext('2d');
            trendChartInstance = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: trendLabels.length ? trendLabels : ['No Data'],
                    datasets: [{
                        label: 'Bookings Reserved',
                        data: trendData.length ? trendData : [0],
                        borderColor: '#eab308',
                        backgroundColor: 'rgba(234, 179, 8, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            // Render Pie Chart
            const ctx2 = document.getElementById('popularTimesChart').getContext('2d');
            timesChartInstance = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: pieLabels.length ? pieLabels : ['No Data'],
                    datasets: [{
                        data: pieData.length ? pieData : [1],
                        backgroundColor: [
                            '#eab308', '#a855f7', '#3b82f6', '#ec4899', '#22c55e'
                        ],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
            });

            // Render Guests Bar Chart
            const ctx3 = document.getElementById('guestsChart').getContext('2d');
            guestsChartInstance = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: trendLabels.length ? trendLabels : ['No Data'],
                    datasets: [{
                        label: 'Expected Guests',
                        data: guestData.length ? guestData : [0],
                        backgroundColor: '#22c55e',
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }