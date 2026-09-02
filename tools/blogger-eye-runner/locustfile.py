import os

from locust import HttpUser, between, task

from runner import allowed_hosts, validate_target


TARGET_URL = validate_target(os.environ.get("BLOGGER_EYE_TARGET_URL"), allowed_hosts())


class AuthorizedWebsiteUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def visit_authorized_target(self):
        self.client.get(TARGET_URL, name="authorized-target", allow_redirects=True)
