// --- INITIALIZE SUPABASE ---
// REPLACE THESE WITH YOUR ACTUAL SUPABASE URL AND ANON KEY
const SUPABASE_URL = 'https://lgjtenekxmeonkcsjdyq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnanRlbmVreG1lb25rY3NqZHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTY1NzEsImV4cCI6MjEwNzE5MjU3MX0.jTx4ambwB8AUJ8_TkzRdpX3sukkXb3f8gZQwWM3Dy_Y';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM ELEMENTS ---
const tncSection = document.getElementById('tnc-section');
const authSection = document.getElementById('auth-section');
const orderSection = document.getElementById('order-section');
const summarySection = document.getElementById('summary-section');

const agreeBtn = document.getElementById('agree-btn');
const loginBtn = document.getElementById('login-btn');
const submitBtn = document.getElementById('submit-btn');
const viewSummaryBtn = document.getElementById('view-summary-btn');
const backToOrderBtn = document.getElementById('back-to-order-btn');

let currentUser = { phone: null, name: null, id: null };

// --- UI NAVIGATION ---
function showSection(sectionId) {
    [tncSection, authSection, orderSection, summarySection].forEach(el => el.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

// 1. User Agrees to T&C
agreeBtn.addEventListener('click', () => {
    showSection('auth-section');
});

// 2. User enters Phone and Name
loginBtn.addEventListener('click', async () => {
    const phone = document.getElementById('phone').value.trim();
    const name = document.getElementById('name').value.trim();

    if (!phone || !name) {
        document.getElementById('auth-error').classList.remove('hidden');
        return;
    }
    
    currentUser.phone = phone;
    currentUser.name = name;
    
    // Check if user already has an order to pre-fill it
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('phone_number', phone)
        .maybeSingle();

    if (data) {
        currentUser.id = data.id; // Store ID for updating
        document.getElementById('meat-type').value = data.meat_type;
        document.getElementById('quantity').value = data.quantity;
        document.getElementById('comments').value = data.comments;
        document.getElementById('welcome-msg').innerText = `Welcome back, ${name}. You can edit your existing order below.`;
    } else {
        document.getElementById('welcome-msg').innerText = `Hi ${name}, please enter your order details.`;
    }

    showSection('order-section');
});

// 3. User Submits Order
submitBtn.addEventListener('click', async () => {
    const meat_type = document.getElementById('meat-type').value;
    const quantity = parseFloat(document.getElementById('quantity').value);
    const comments = document.getElementById('comments').value.trim();
    
    if (!quantity || quantity <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    submitBtn.innerText = "Submitting...";
    
    const payload = {
        phone_number: currentUser.phone,
        full_name: currentUser.name,
        meat_type: meat_type,
        quantity: quantity,
        comments: comments
    };

    let error;

    if (currentUser.id) {
        // Edit existing order based on ID
        const res = await supabase.from('orders').update(payload).eq('id', currentUser.id);
        error = res.error;
    } else {
        // Create new order
        const res = await supabase.from('orders').insert([payload]).select();
        error = res.error;
        if (res.data && res.data.length > 0) {
            currentUser.id = res.data[0].id; // Save ID in case they edit it again in same session
        }
    }

    submitBtn.innerText = "Submit Order";

    if (error) {
        alert("Error saving order. Please try again.");
        console.error(error);
    } else {
        document.getElementById('success-msg').classList.remove('hidden');
        setTimeout(() => { document.getElementById('success-msg').classList.add('hidden'); }, 4000);
    }
});

// 4. View Summary
viewSummaryBtn.addEventListener('click', async () => {
    showSection('summary-section');
    const tbody = document.querySelector('#summary-table tbody');
    tbody.innerHTML = '<tr><td colspan="4">Loading orders...</td></tr>';

    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="4" class="error">Failed to load orders.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No orders yet.</td></tr>';
    } else {
        data.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${order.full_name}</td>
                <td>${order.meat_type}</td>
                <td>${order.quantity}</td>
                <td>${order.comments || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    }
});

backToOrderBtn.addEventListener('click', () => {
    if (currentUser.phone) {
        showSection('order-section');
    } else {
        showSection('auth-section');
    }
});
