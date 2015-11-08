<?php namespace App\Ninja\Transformers;

use App\Models\Contact;
use League\Fractal;
use League\Fractal\TransformerAbstract;

class ContactTransformer extends TransformerAbstract
{
    public function transform(Contact $contact)
    {
        return [
            'public_id' => (int) $contact->public_id,
            'first_name' => $contact->first_name,
            'last_name' => $contact->last_name,
            'email' => $contact->email,
            'user_id' => (int) $contact->user_id,
            'updated_at' => $contact->updated_at,
            'deleted_at' => $contact->deleted_at,
            'is_primary' => (bool) $contact->is_primary,
            'phone' => $contact->phone,
            'last_login' => $contact->last_login,
            'account_key' => $contact->account->account_key
        ];
    }
}