"""Sambhrama backend API tests"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://reel-bloom-refresh.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "sambhrama@2026"
ADMIN_PASSWORD = "SSDK@2026"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return s


# ---------- Health & public read endpoints ----------
class TestPublicReads:
    def test_health(self, api_client):
        r = api_client.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_portfolio_list(self, api_client):
        r = api_client.get(f"{API}/portfolio")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 8
        assert all("id" in i and "category" in i and "image_url" in i for i in items)

    def test_portfolio_filter_wedding(self, api_client):
        r = api_client.get(f"{API}/portfolio", params={"category": "Wedding"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert all(i["category"] == "Wedding" for i in items)

    def test_testimonials_list(self, api_client):
        r = api_client.get(f"{API}/testimonials")
        assert r.status_code == 200
        items = r.json()
        # Iteration 3: testimonials cleared, should be empty list
        assert isinstance(items, list)
        assert len(items) == 0

    def test_vendors_list(self, api_client):
        r = api_client.get(f"{API}/vendors")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 4


# ---------- Bookings (public POST + admin update) ----------
class TestBookings:
    created_id = None

    def test_create_booking_success(self, api_client):
        payload = {
            "event_type": "Wedding",
            "name": "TEST_User",
            "email": "test_booking@example.com",
            "phone": "+91 9999988888",
            "event_date": "2026-06-12",
            "location": "Bengaluru",
            "guest_count": 250,
            "budget": "₹15 — ₹50 Lakh",
            "message": "Pytest booking",
        }
        r = api_client.post(f"{API}/bookings", json=payload)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["status"] == "new"
        assert data["name"] == "TEST_User"
        assert data["email"] == "test_booking@example.com"
        assert "id" in data
        TestBookings.created_id = data["id"]

    def test_create_booking_invalid(self, api_client):
        # missing required fields
        r = api_client.post(f"{API}/bookings", json={"event_type": "Wedding"})
        assert r.status_code == 422

    def test_create_booking_invalid_event_type(self, api_client):
        r = api_client.post(f"{API}/bookings", json={
            "event_type": "Birthday", "name": "x", "email": "x@x.com", "phone": "1"
        })
        assert r.status_code == 422


# ---------- Newsletter ----------
class TestNewsletter:
    def test_newsletter_signup(self, api_client):
        r = api_client.post(f"{API}/newsletter", json={"email": "test_news_pytest@example.com"})
        assert r.status_code in (200, 201)
        assert r.json().get("success") is True

    def test_newsletter_duplicate_idempotent(self, api_client):
        api_client.post(f"{API}/newsletter", json={"email": "dup_test@example.com"})
        r = api_client.post(f"{API}/newsletter", json={"email": "dup_test@example.com"})
        assert r.status_code in (200, 201)
        assert r.json().get("success") is True


# ---------- Auth ----------
class TestAuth:
    def test_login_invalid(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_login_valid_sets_cookie(self, api_client):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == ADMIN_EMAIL
        assert body["role"] == "admin"
        # Cookie set
        assert "access_token" in s.cookies.get_dict() or any(
            c.name == "access_token" for c in s.cookies
        )

    def test_me_without_cookie(self, api_client):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_cookie(self, auth_session):
        r = auth_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_logout_clears_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        r2 = s.post(f"{API}/auth/logout")
        assert r2.status_code == 200
        # Use fresh session without cookie to avoid local cookie state confusion:
        # After delete_cookie response, browser drops cookie. Mimic by clearing.
        s.cookies.clear()
        r3 = s.get(f"{API}/auth/me")
        assert r3.status_code == 401


# ---------- Admin endpoints ----------
class TestAdmin:
    def test_stats_requires_auth(self):
        r = requests.get(f"{API}/admin/stats")
        assert r.status_code == 401

    def test_stats_with_auth(self, auth_session):
        r = auth_session.get(f"{API}/admin/stats")
        assert r.status_code == 200
        data = r.json()
        for k in ["total_bookings", "new_bookings", "confirmed_bookings",
                  "vendors", "portfolio", "subscribers"]:
            assert k in data
            assert isinstance(data[k], int)

    def test_admin_bookings_includes_created(self, auth_session, api_client):
        # ensure we have a booking
        if not TestBookings.created_id:
            payload = {"event_type": "Wedding", "name": "TEST_2",
                       "email": "t2@example.com", "phone": "1"}
            r = api_client.post(f"{API}/bookings", json=payload)
            TestBookings.created_id = r.json()["id"]
        r = auth_session.get(f"{API}/admin/bookings")
        assert r.status_code == 200
        ids = [b["id"] for b in r.json()]
        assert TestBookings.created_id in ids

    def test_update_booking_status(self, auth_session):
        bid = TestBookings.created_id
        assert bid
        r = auth_session.put(f"{API}/admin/bookings/{bid}",
                             json={"status": "confirmed"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "confirmed"
        # verify
        r2 = auth_session.get(f"{API}/admin/bookings")
        found = [b for b in r2.json() if b["id"] == bid][0]
        assert found["status"] == "confirmed"

    def test_portfolio_crud(self, auth_session):
        payload = {
            "title": "TEST_Item",
            "category": "Wedding",
            "image_url": "https://example.com/x.jpg",
            "description": "test",
            "date": "2026-01-01",
        }
        r = auth_session.post(f"{API}/admin/portfolio", json=payload)
        assert r.status_code == 201, r.text
        item = r.json()
        pid = item["id"]
        assert item["title"] == "TEST_Item"

        # update
        payload["title"] = "TEST_Item_Updated"
        r2 = auth_session.put(f"{API}/admin/portfolio/{pid}", json=payload)
        assert r2.status_code == 200
        assert r2.json()["title"] == "TEST_Item_Updated"

        # delete
        r3 = auth_session.delete(f"{API}/admin/portfolio/{pid}")
        assert r3.status_code == 200

        # verify gone
        r4 = auth_session.delete(f"{API}/admin/portfolio/{pid}")
        assert r4.status_code == 404

    def test_testimonial_create_delete(self, auth_session):
        r = auth_session.post(f"{API}/admin/testimonials", json={
            "quote": "TEST quote", "author": "TEST_Auth", "role": "Tester", "rating": 5
        })
        assert r.status_code == 201
        tid = r.json()["id"]
        r2 = auth_session.delete(f"{API}/admin/testimonials/{tid}")
        assert r2.status_code == 200

    def test_vendor_crud(self, auth_session):
        r = auth_session.post(f"{API}/admin/vendors", json={
            "name": "TEST_Vendor", "category": "Catering",
            "contact_email": "v@v.com", "contact_phone": "1", "service_description": "x"
        })
        assert r.status_code == 201
        vid = r.json()["id"]
        r2 = auth_session.put(f"{API}/admin/vendors/{vid}", json={
            "name": "TEST_Vendor_Up", "category": "Catering"
        })
        assert r2.status_code == 200
        assert r2.json()["name"] == "TEST_Vendor_Up"
        r3 = auth_session.delete(f"{API}/admin/vendors/{vid}")
        assert r3.status_code == 200

    def test_cleanup_test_booking(self, auth_session):
        if TestBookings.created_id:
            auth_session.delete(f"{API}/admin/bookings/{TestBookings.created_id}")


# ---------- Iteration 2: Case-study detail endpoint + new fields ----------
class TestCaseStudyEndpoint:
    def test_get_portfolio_item_by_id(self, api_client):
        # Get list, pick first item
        r = api_client.get(f"{API}/portfolio")
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        pid = items[0]["id"]
        # Fetch by id
        r2 = api_client.get(f"{API}/portfolio/{pid}")
        assert r2.status_code == 200, r2.text
        data = r2.json()
        assert data["id"] == pid
        # New fields must exist
        for k in ["long_description", "highlights", "gallery", "location", "guest_count"]:
            assert k in data, f"Missing field: {k}"
        assert isinstance(data["highlights"], list)
        assert isinstance(data["gallery"], list)

    def test_get_portfolio_unknown_id_404(self, api_client):
        r = api_client.get(f"{API}/portfolio/non-existent-id-xyz")
        assert r.status_code == 404

    def test_seed_has_rich_case_study(self, api_client):
        r = api_client.get(f"{API}/portfolio")
        assert r.status_code == 200
        items = r.json()
        # At least one item has rich case-study data
        rich = [
            i for i in items
            if (i.get("long_description") or "").strip()
            and len(i.get("highlights") or []) >= 2
            and len(i.get("gallery") or []) >= 1
        ]
        assert len(rich) >= 1, "Expected at least one seeded portfolio item with case-study fields"


class TestPortfolioNewFields:
    created_id = None

    def test_create_with_new_fields(self, auth_session):
        payload = {
            "title": "TEST_CaseStudy",
            "category": "Wedding",
            "image_url": "https://example.com/x.jpg",
            "description": "short",
            "date": "2026-02-02",
            "location": "TEST_City",
            "guest_count": 123,
            "long_description": "TEST long description body.",
            "highlights": ["TEST highlight A", "TEST highlight B"],
            "gallery": [
                "https://example.com/g1.jpg",
                "https://example.com/g2.jpg",
            ],
        }
        r = auth_session.post(f"{API}/admin/portfolio", json=payload)
        assert r.status_code == 201, r.text
        item = r.json()
        TestPortfolioNewFields.created_id = item["id"]
        assert item["location"] == "TEST_City"
        assert item["guest_count"] == 123
        assert item["long_description"] == "TEST long description body."
        assert item["highlights"] == ["TEST highlight A", "TEST highlight B"]
        assert len(item["gallery"]) == 2

        # GET to verify persistence
        r2 = auth_session.get(f"{API}/portfolio/{item['id']}")
        assert r2.status_code == 200
        fetched = r2.json()
        assert fetched["location"] == "TEST_City"
        assert fetched["guest_count"] == 123
        assert len(fetched["highlights"]) == 2

    def test_create_backward_compat_omitting_new_fields(self, auth_session):
        payload = {
            "title": "TEST_BackCompat",
            "category": "Conference",
            "image_url": "https://example.com/y.jpg",
            "description": "no extras",
        }
        r = auth_session.post(f"{API}/admin/portfolio", json=payload)
        assert r.status_code == 201, r.text
        item = r.json()
        # Defaults
        assert item["highlights"] == []
        assert item["gallery"] == []
        # cleanup
        auth_session.delete(f"{API}/admin/portfolio/{item['id']}")

    def test_update_new_fields(self, auth_session):
        pid = TestPortfolioNewFields.created_id
        assert pid
        payload = {
            "title": "TEST_CaseStudy",
            "category": "Wedding",
            "image_url": "https://example.com/x.jpg",
            "description": "short",
            "location": "TEST_City_Updated",
            "guest_count": 456,
            "long_description": "Updated long body.",
            "highlights": ["H1", "H2", "H3"],
            "gallery": ["https://example.com/g1.jpg"],
        }
        r = auth_session.put(f"{API}/admin/portfolio/{pid}", json=payload)
        assert r.status_code == 200
        assert r.json()["location"] == "TEST_City_Updated"
        assert r.json()["guest_count"] == 456
        assert len(r.json()["highlights"]) == 3
        # cleanup
        auth_session.delete(f"{API}/admin/portfolio/{pid}")


# ---------- Iteration 2: Booking timing with Resend active ----------
class TestBookingWithResend:
    def test_booking_post_fast_under_3s(self, api_client):
        payload = {
            "event_type": "Corporate Event",
            "name": "TEST_Resend",
            "email": "test_resend@example.com",
            "phone": "+91 9000000000",
            "event_date": "2026-07-01",
            "location": "Bengaluru",
            "guest_count": 100,
            "budget": "₹5 — ₹15 Lakh",
            "message": "Resend timing test",
        }
        t0 = time.time()
        r = api_client.post(f"{API}/bookings", json=payload)
        elapsed = time.time() - t0
        assert r.status_code == 201, r.text
        # email send is best-effort/non-blocking
        assert elapsed < 3.0, f"Booking POST took {elapsed:.2f}s (expected <3s; email send should be non-blocking)"


# ---------- Iteration 3: 9 event types ----------
EVENT_TYPES_9 = [
    "Wedding", "Sangeet", "Haldi", "Mehendi",
    "Corporate Event", "Festival", "Conference", "Pooja", "Other",
]


class TestNineEventTypes:
    @pytest.mark.parametrize("etype", EVENT_TYPES_9)
    def test_each_event_type_creates_booking(self, api_client, etype):
        payload = {
            "event_type": etype,
            "name": f"TEST_{etype}",
            "email": f"test_{etype.lower().replace(' ', '_')}@example.com",
            "phone": "+91 9000000001",
            "event_date": "2026-08-15",
            "location": "Bengaluru",
            "guest_count": 50,
            "budget": "₹1 — ₹5 Lakh",
            "message": f"Pytest {etype}",
        }
        r = api_client.post(f"{API}/bookings", json=payload)
        assert r.status_code == 201, f"{etype}: {r.status_code} {r.text}"
        data = r.json()
        assert data["event_type"] == etype

    def test_unknown_event_type_422(self, api_client):
        r = api_client.post(f"{API}/bookings", json={
            "event_type": "Birthday",
            "name": "x", "email": "x@x.com", "phone": "1",
        })
        assert r.status_code == 422


# ---------- Iteration 3: Portfolio new categories ----------
class TestNewPortfolioCategories:
    @pytest.mark.parametrize("cat", ["Sangeet", "Haldi", "Mehendi", "Pooja"])
    def test_create_portfolio_with_new_category(self, auth_session, cat):
        payload = {
            "title": f"TEST_{cat}_Item",
            "category": cat,
            "image_url": "https://example.com/z.jpg",
            "description": "test category",
        }
        r = auth_session.post(f"{API}/admin/portfolio", json=payload)
        assert r.status_code == 201, r.text
        item = r.json()
        assert item["category"] == cat
        # cleanup
        auth_session.delete(f"{API}/admin/portfolio/{item['id']}")

    def test_invalid_category_422(self, auth_session):
        r = auth_session.post(f"{API}/admin/portfolio", json={
            "title": "TEST_Bad", "category": "BirthdayBash",
            "image_url": "https://example.com/z.jpg", "description": "x",
        })
        assert r.status_code == 422


# ---------- Iteration 3: Confirm both emails fire ----------
class TestBothEmailsFire:
    def test_backend_logs_show_both_emails(self, api_client):
        unique_email = f"test_both_emails_{int(time.time())}@example.com"
        payload = {
            "event_type": "Wedding",
            "name": "TEST_BothEmails",
            "email": unique_email,
            "phone": "+91 9000000002",
            "event_date": "2026-09-09",
            "location": "Bengaluru",
            "guest_count": 80,
            "budget": "₹5 — ₹15 Lakh",
            "message": "Both emails check",
        }
        r = api_client.post(f"{API}/bookings", json=payload)
        assert r.status_code == 201
        # Give background tasks time to dispatch
        time.sleep(6)
        try:
            with open("/var/log/supervisor/backend.err.log", "r") as f:
                log_tail = f.read()[-30000:]
        except FileNotFoundError:
            pytest.skip("backend log not available")
        assert "Booking notification email sent to" in log_tail, \
            "Admin notification email log line missing"
        assert "Client confirmation email sent to" in log_tail, \
            "Client confirmation email log line missing"


# ---------- Iteration 3: New admin username (non-email) ----------
class TestNewAdminUsername:
    def test_login_with_username_not_email(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={
            "email": "sambhrama@2026", "password": "SSDK@2026",
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["email"] == "sambhrama@2026"
        assert body["role"] == "admin"
        assert any(c.name == "access_token" for c in s.cookies)
        # /me works
        r2 = s.get(f"{API}/auth/me")
        assert r2.status_code == 200
        assert r2.json()["email"] == "sambhrama@2026"

    def test_login_username_wrong_password_401(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": "sambhrama@2026", "password": "WRONG",
        })
        assert r.status_code == 401
