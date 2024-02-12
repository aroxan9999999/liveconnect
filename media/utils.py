import re
import redis

redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)


def format_numbers_correctly(s):
    if s == '0':
        return ''

    def format_match(match):
        number = match.group(0)
        if len(number) > 2:
            formatted_number = ' '.join(re.findall('.{1,3}', number[::-1]))[::-1]
        else:
            formatted_number = number
        return formatted_number

    return re.sub(r'\d+', format_match, s)


def get_toggle_heart(object_id, user_id):
    key = f"hearts:{object_id}"
    already_hearted = redis_client.sismember(key, user_id)
    if already_hearted:
        hearted = False
        src = 'icons/heart.svg'
    else:
        hearted = True
        src = 'icons/lowe.svg'

    count = redis_client.scard(key)
    return {"hearts_count": format_numbers_correctly(str(count)), "hearted": hearted, 'src': src}
