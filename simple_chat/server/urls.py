from django.conf.urls import url
from server import views

urlpatterns = [
    url(r'^$', views.index, name='homepage'),
]