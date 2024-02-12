from django import template

register = template.Library()


@register.filter(name='get_by_index')
def get_by_index(value, arg):
    """Gets an element from a list using its index."""
    try:
        return value[arg]
    except IndexError:
        return None
