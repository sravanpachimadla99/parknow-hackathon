import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [days, setDays] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((res) => res.json())
      .then(setVehicles)
      .catch(() => setMessage('Unable to load vehicle inventory.'));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const sessionId = params.get('session_id');
    const canceled = params.get('cancel');

    if (success === 'true' && sessionId) {
      setLoading(true);
      fetch(`/api/bookings/confirm?sessionId=${encodeURIComponent(sessionId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setMessage(data.error);
          } else {
            setMessage(`Booking confirmed: ${data.vehicleName} for ${data.days} day(s). Total ₹${data.totalAmount}.`);
            setSelectedVehicle(null);
            setCustomerName('');
            setEmail('');
            setDays(1);
          }
        })
        .catch(() => setMessage('Unable to confirm booking after payment.'))
        .finally(() => {
          setLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    if (canceled === 'true') {
      setMessage('Payment was canceled. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleBook = async (event) => {
    event.preventDefault();
    if (!selectedVehicle) {
      setMessage('Please select a vehicle first.');
      return;
    }

    setLoading(true);
    setMessage('');

    const body = {
      vehicleId: selectedVehicle.id,
      customerName,
      email,
      days
    };

    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Unable to start payment session.');
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setMessage('Stripe failed to initialize.');
        return;
      }

      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result.error) {
        setMessage(result.error.message || 'Unable to redirect to checkout.');
      }
    } catch (error) {
      setMessage('Payment service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <h1>Telangana Vehicle Rental</h1>
          <p>Explore local cars, SUVs, hatchbacks, and auto rickshaws with pricing by segment.</p>
        </div>
      </header>

      <section className="inventory">
        <h2>Available Vehicles</h2>
        <div className="cards">
          {vehicles.map((vehicle) => (
            <article key={vehicle.id} className="card">
              <img src={vehicle.imageUrl} alt={vehicle.name} />
              <div className="card-body">
                <h3>{vehicle.name}</h3>
                <p className="meta">{vehicle.segment} • {vehicle.location}</p>
                <p>Seats: {vehicle.seats}</p>
                <p className="price">₹{vehicle.pricePerDay} / day</p>
                <button onClick={() => setSelectedVehicle(vehicle)}>
                  Select this vehicle
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedVehicle && (
        <section className="booking-panel">
          <h2>Book {selectedVehicle.name}</h2>
          <form onSubmit={handleBook}>
            <div className="field-group">
              <label>Name</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="field-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field-group">
              <label>Days</label>
              <input type="number" min="1" value={days} onChange={(e) => setDays(Number(e.target.value))} required />
            </div>
            <div className="summary">
              <p>Total: <strong>₹{selectedVehicle.pricePerDay * Math.max(days, 1)}</strong></p>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Pay with Stripe'}
            </button>
          </form>
          {message && <p className="status">{message}</p>}
        </section>
      )}
    </div>
  );
}

export default App;
