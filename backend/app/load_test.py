from locust import HttpUser, between, task


class AegisUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def list_assessments(self):
        with self.client.get(
            "/api/v1/assessments/",
            name="GET /api/v1/assessments",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(f"Unexpected status: {response.status_code}")
