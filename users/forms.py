from django.utils.translation import gettext_lazy as _
from .models import SocialLiveUser
from django import forms
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import phonenumbers

User = get_user_model()


def validate_phone_number(value):
    try:
        phone_number = phonenumbers.parse(value, None)
        if not phonenumbers.is_valid_number(phone_number):
            raise ValidationError("Номер телефона невалиден")
    except phonenumbers.NumberParseException:
        raise ValidationError("Неверный формат номера телефона")


class CustomUserCreationForm(forms.ModelForm):
    password1 = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': _('Password')}))
    password2 = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': _('Confirm Password')}))
    birth_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date', 'placeholder': _('Birth Date')}),
        required=False
    )

    phone = forms.CharField(validators=[validate_phone_number], max_length=17, required=False)

    class Meta:
        model = SocialLiveUser
        fields = ['username', 'last_name', 'email', 'password1', 'password2', 'phone']
        widgets = {
            'username': forms.TextInput(attrs={'placeholder': _('Username')}),
            'email': forms.EmailInput(attrs={'placeholder': _('Email')}),
        }

    def __init__(self, *args, **kwargs):
        super(CustomUserCreationForm, self).__init__(*args, **kwargs)
        self.fields['username'].widget.attrs['placeholder'] = _('Username')
        self.fields['email'].widget.attrs['placeholder'] = _('Email')
        self.fields['password1'].widget.attrs['placeholder'] = _('Password')
        self.fields['password2'].widget.attrs['placeholder'] = _('Confirm Password')

        self.fields['username'].help_text = _('A unique username to identify you.')
        self.fields['email'].help_text = _('A valid email address.')
        self.fields['password1'].help_text = _('Make sure your password is strong.')
        self.fields['password2'].help_text = _('Enter the same password as before for verification.')

        self.fields['username'].error_messages = {
            'unique': _("This username is already taken."),
            'invalid': _("This username contains invalid characters."),
        }
        self.fields['email'].error_messages = {
            'unique': _("This email is already in use."),
            'invalid': _("Enter a valid email address."),
        }
        self.fields['password2'].error_messages = {
            'password_mismatch': _("The two password fields didn’t match."),
        }

        for fieldname in ['username', 'email', 'password1', 'password2']:
            self.fields[fieldname].help_text = None

        for field in self.fields.values():
            field.error_messages = {'required': _("This field is required.")}

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError(_("The two password fields didn't match."))
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


