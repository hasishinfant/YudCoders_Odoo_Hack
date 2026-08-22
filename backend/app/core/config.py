import os

# Standard Working Hours Configuration
STANDARD_WORKING_HOURS: float = float(os.environ.get("STANDARD_WORKING_HOURS", "8.0"))

# Timezone strategy (UTC by default)
TIMEZONE: str = os.environ.get("TIMEZONE", "UTC")
